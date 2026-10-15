import { z } from "zod";
import express from "express";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { formatRefreshFailure } from "./utils";
import { FetchPage, VendorStore } from "../types.js";
import { parseCybersecToolsTool } from "./source.js";
import { playwrightFetchPage } from "./playwrightFetch.js";
import {
  getVendor as getDefaultVendor,
  listVendors as listDefaultVendors,
  refreshVendor as refreshDefaultVendor,
  updateVendor as updateDefaultVendor,
} from "./database";

const defaultStore: VendorStore = {
  getVendor: getDefaultVendor,
  listVendors: listDefaultVendors,
  updateVendor: updateDefaultVendor,
  refreshVendor: refreshDefaultVendor,
};

export const defaultFetchPage: FetchPage = (sourceUrl) =>
  playwrightFetchPage(sourceUrl);

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

export async function refreshVendorRecord({
  vendorId,
  store = defaultStore,
  fetchPage = defaultFetchPage,
}: {
  vendorId: string;
  store?: VendorStore;
  fetchPage?: FetchPage;
}) {
  const vendor = await store.getVendor(vendorId);
  if (!vendor) {
    return { status: 404, error: "Vendor not found" } as const;
  }

  const source = new URL(vendor.sourceUrl);
  if (source.protocol !== "https:" || source.hostname !== "cybersectools.com") {
    return {
      status: 400,
      error: "The saved source URL is not a CybersecTools page",
    } as const;
  }

  try {
    const upstream = await fetchPage(source);
    if (!upstream.ok) {
      return {
        status: upstream.status === 429 ? 429 : 502,
        error: formatRefreshFailure(upstream.status),
      } as const;
    }

    const { name, website, description } = parseCybersecToolsTool(
      await upstream.text(),
    );
    if (!name || !website || !description) {
      return {
        status: 422,
        error: "The source page did not contain all required vendor fields",
      } as const;
    }

    await store.refreshVendor(vendor.id, { name, website, description });
    return {
      status: 200,
      vendor: (await store.getVendor(vendor.id)),
    } as const;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Source refresh failed";
    return { status: 502, error: message } as const;
  }
}

export function createApp({
  store = defaultStore,
  fetchPage = defaultFetchPage,
}: {
  store?: VendorStore;
  fetchPage?: FetchPage;
} = {}) {
  const app = express();
  app.use(express.json({ limit: "32kb" }));

  app.get("/api/vendors", async (request, response) => {
    const search = typeof request.query.q === "string" ? request.query.q : "";
    response.json(await store.listVendors(search));
  });

  app.get("/api/vendors/:id", async (request, response) => {
    const vendor = await store.getVendor(request.params.id);
    if (!vendor) {
      response.status(404).json({ error: "Vendor not found" });
      return;
    }
    response.json(vendor);
  });

  app.put("/api/vendors/:id", async (request, response) => {
    const vendor = await store.getVendor(request.params.id);
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

    await store.updateVendor(vendor.id, parsed.data);
    response.json((await store.getVendor(vendor.id)));
  });

  app.post("/api/vendors/:id/refresh", async (request, response) => {
    const result = await refreshVendorRecord({
      vendorId: request.params.id,
      store,
      fetchPage,
    });

    if ("error" in result) {
      response.status(result.status).json({ error: result.error });
      return;
    }

    response.json(result.vendor);
  });

  const distPath = resolve(process.cwd(), "dist");
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("{*path}", (request, response, next) => {
      if (request.path.startsWith("/api/")) {
        next();
        return;
      }
      response.sendFile(resolve(distPath, "index.html"));
    });
  }

  return app;
}

export const app = createApp();

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
const isDirectExecution =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectExecution) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Vendor API listening on http://localhost:${port}`);
  });
}
