import { once } from "node:events";
import type { Express } from "express";
import type { AddressInfo } from "node:net";
import type { FetchPage } from "./index.js";
import type { SeedVendor } from "../types";
import { createDatabase, createVendorRepository } from "./database";

export const AIRLOCK_ID = "airlock-digital-agentic-ai-control-and-governance";

export function makeVendor(overrides: Partial<SeedVendor> = {}): SeedVendor {
  const id = overrides.id ?? AIRLOCK_ID;
  return {
    id,
    name: "Old name",
    website: "https://old.example.com/",
    description: "Old description",
    sourceUrl: `https://cybersectools.com/tools/${id}`,
    sourcePage: 1,
    ...overrides,
  };
}

export function makeStore(vendors: SeedVendor[] = [makeVendor()]) {
  const store = createVendorRepository(createDatabase(":memory:"));
  vendors.forEach((vendor) => store.insertVendorIfNotExists(vendor));
  return store;
}

export const respond =
  (status: number, body = ""): FetchPage =>
  async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  });

export const FULL_PAGE = `
  <h1>New Product Name</h1>
  <p>New description from source.</p>
  <a href="/companies/acme">By Acme</a>
  <a href="https://acme.example/product?utm_source=cybersectools.com&amp;utm_medium=tool-detail">Visit Website</a>`;

export async function startServer(app: Express) {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((done) => {
        server.closeAllConnections?.();
        server.close(() => done());
      }),
  };
}
