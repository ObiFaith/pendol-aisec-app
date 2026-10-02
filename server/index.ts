import { z } from "zod";
import express from "express";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { db, getVendor, listVendors } from "./db.js";
import { parseCybersecToolsTool } from "./source.js";

export const app = express();
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
app.use(express.json({ limit: "32kb" }));

export function formatRefreshFailure(status: number): string {
  switch (status) {
    case 429:
      return "CybersecTools is rate-limiting requests right now. Please wait a moment and try again.";
    case 403:
      return "CybersecTools is blocking requests from this environment. Please try again later.";
    default:
      return `CybersecTools returned HTTP ${status}`;
  }
}

const vendorFields = z.object({
  name: z.string().trim().min(1).max(160),
  website: z
    .string()
    .trim()
    .max(2048)
    .refine(
      (value) => value === "" || /^https?:\/\//i.test(value),
      "Website must be an http(s) URL",
    ),
  description: z.string().trim().max(12000),
});

app.get("/api/vendors", (request, response) => {
  const search = typeof request.query.q === "string" ? request.query.q : "";
  response.json(listVendors(search));
});

app.get("/api/vendors/:id", (request, response) => {
  const vendor = getVendor(request.params.id);
  if (!vendor) {
    response.status(404).json({ error: "Vendor not found" });
    return;
  }
  response.json(vendor);
});

app.put("/api/vendors/:id", (request, response) => {
  const vendor = getVendor(request.params.id);
  if (!vendor) {
    response.status(404).json({ error: "Vendor not found" });
    return;
  }

  const parsed = vendorFields.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      error: parsed.error.issues[0]?.message ?? "Invalid vendor data",
    });
    return;
  }

  db.prepare(
    `
    UPDATE vendors SET name = @name, website = @website,
      description = @description, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `,
  ).run({ ...parsed.data, id: vendor.id });
  response.json(getVendor(vendor.id));
});

app.post("/api/vendors/:id/refresh", async (request, response) => {
  const vendor = getVendor(request.params.id);
  if (!vendor) {
    response.status(404).json({ error: "Vendor not found" });
    return;
  }

  const source = new URL(vendor.sourceUrl);
  if (source.protocol !== "https:" || source.hostname !== "cybersectools.com") {
    response
      .status(400)
      .json({ error: "The saved source URL is not a CybersecTools page" });
    return;
  }

  try {
    const upstream = await fetch(source, {
      headers: { "User-Agent": "AI-Security-Vendor-Register/1.0" },
      signal: AbortSignal.timeout(12000),
    });
    if (!upstream.ok) {
      response
        .status(upstream.status === 429 ? 429 : 502)
        .json({ error: formatRefreshFailure(upstream.status) });
      return;
    }

    const record = parseCybersecToolsTool(await upstream.text());
    if (!record.name || !record.website || !record.description) {
      response.status(422).json({
        error: "The source page did not contain all required vendor fields",
      });
      return;
    }

    db.prepare(
      `
      UPDATE vendors SET name = @name, website = @website,
        description = @description, refreshed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `,
    ).run({
      id: vendor.id,
      name: record.name,
      website: record.website,
      description: record.description,
    });
    response.json(getVendor(vendor.id));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Source refresh failed";
    response.status(502).json({ error: message });
  }
});

const distPath = resolve(process.cwd(), "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("{*path}", (request, response, next) => {
    if (request.path.startsWith("/api")) {
      next();
      return;
    }
    response.sendFile(resolve(distPath, "index.html"));
  });
}

const isDirectExecution =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectExecution) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Vendor API listening on http://localhost:${port}`);
  });
}
