import { once } from "node:events";
import type { Express } from "express";
import type { AddressInfo } from "node:net";
import type { FetchPage, SeedVendor, Vendor, VendorRepository } from "../types";

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

export function makeStore(
  seed: SeedVendor[] = [makeVendor()],
): VendorRepository {
  const rows = new Map<string, Vendor>();
  const now = () => new Date().toISOString();

  const insert = (v: SeedVendor) => {
    if (!rows.has(v.id)) {
      rows.set(v.id, {
        ...v,
        createdAt: now(),
        updatedAt: now(),
        refreshedAt: null,
      } as Vendor);
    }
  };
  seed.forEach(insert);

  const copy = (v: Vendor | undefined) => (v ? { ...v } : undefined);

  return {
    async listVendors(search = "") {
      const term = search.trim().toLowerCase();
      return [...rows.values()]
        .filter((v) =>
          [v.name, v.website, v.description].some((f) =>
            f.toLowerCase().includes(term),
          ),
        )
        .sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
        )
        .map((v) => ({ ...v }));
    },
    async getVendor(id) {
      return copy(rows.get(id));
    },
    async updateVendor(id, draft) {
      const row = rows.get(id);
      if (row) rows.set(id, { ...row, ...draft, updatedAt: now() });
    },
    async refreshVendor(id, draft) {
      const row = rows.get(id);
      if (row)
        rows.set(id, {
          ...row,
          ...draft,
          refreshedAt: now(),
          updatedAt: now(),
        });
    },
    async insertVendorIfNotExists(v) {
      insert(v);
    },
    async insertVendorsIfNotExist(items) {
      items.forEach(insert);
    },
  };
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
