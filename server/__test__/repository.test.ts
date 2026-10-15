// @vitest-environment node
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "../database/schema.js";
import { VendorRepository } from "../../types.js";
import { createVendorRepository } from "../database/index.js";
import { makeVendor } from "../testUtils.js";


let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
let repo: VendorRepository;

beforeAll(async () => {
  client = new PGlite(); // no path or URL: purely in-memory, in this process
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: resolve(process.cwd(), "server/database/migrations") });
  repo = createVendorRepository(db);
});

beforeEach(async () => {
  await db.execute(sql`TRUNCATE TABLE vendors`);
});

afterAll(async () => {
  await client.close();
});

describe("vendor repository (real SQL)", () => {
  it("sorts by name ignoring case", async () => {
    await repo.insertVendorsIfNotExist([
      makeVendor({ id: "b", name: "beta" }),
      makeVendor({ id: "a", name: "Acme" }),
    ]);
    expect((await repo.listVendors()).map((v) => v.id)).toEqual(["a", "b"]);
  });

  it("searches name, website and description case-insensitively", async () => {
    await repo.insertVendorsIfNotExist([
      makeVendor({ id: "a", name: "Acme", description: "Runtime firewall" }),
      makeVendor({ id: "b", name: "Beta", description: "LLM guardrails" }),
    ]);
    expect((await repo.listVendors("ACME")).map((v) => v.id)).toEqual(["a"]);
    expect((await repo.listVendors("guardrails")).map((v) => v.id)).toEqual(["b"]);
    expect(await repo.listVendors("zzz")).toEqual([]);
  });

  it("insert is a no-op when the id already exists", async () => {
    await repo.insertVendorIfNotExists(makeVendor({ name: "First" }));
    await repo.insertVendorIfNotExists(makeVendor({ name: "Second" }));
    expect((await repo.listVendors()).map((v) => v.name)).toEqual(["First"]);
  });

  it("updateVendor leaves refreshedAt null; refreshVendor sets it", async () => {
    const v = makeVendor();
    await repo.insertVendorIfNotExists(v);
    const draft = { name: "N", website: "https://n.example/", description: "D" };

    await repo.updateVendor(v.id, draft);
    expect((await repo.getVendor(v.id))?.refreshedAt).toBeNull();

    await repo.refreshVendor(v.id, draft);
    expect((await repo.getVendor(v.id))?.refreshedAt).not.toBeNull();
  });
});
