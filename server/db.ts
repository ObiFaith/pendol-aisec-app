import { mkdirSync } from "node:fs";
import Database from "better-sqlite3";
import { dirname, resolve } from "node:path";
import type { Draft, SeedVendor, Vendor } from "../src/types";

export function createDatabase(
  databasePath = resolve(process.cwd(), "data", "vendors.sqlite"),
): Database.Database {
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS vendors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      website TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      source_url TEXT NOT NULL,
      source_page INTEGER NOT NULL CHECK (source_page IN (1, 2)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      refreshed_at TEXT
    );
  `);
  return database;
}

export type VendorRepository = {
  listVendors: (search?: string) => Vendor[];
  getVendor: (id: string) => Vendor | undefined;
  updateVendor: (id: string, draft: Draft) => void;
  refreshVendor: (id: string, draft: Draft) => void;
  insertVendorIfNotExists: (vendor: SeedVendor) => void;
};

export function createVendorRepository(
  database: Database.Database,
): VendorRepository {
  return {
    listVendors(search = "") {
      const pattern = `%${search.trim()}%`;
      return database
        .prepare(
          `
            SELECT id, name, website, description, source_url AS sourceUrl,
              source_page AS sourcePage, created_at AS createdAt,
              updated_at AS updatedAt, refreshed_at AS refreshedAt
            FROM vendors
            WHERE @search = '' OR name LIKE @pattern COLLATE NOCASE
              OR website LIKE @pattern COLLATE NOCASE
              OR description LIKE @pattern COLLATE NOCASE
            ORDER BY name COLLATE NOCASE
          `,
        )
        .all({ search: search.trim(), pattern }) as Vendor[];
    },
    getVendor(id: string): Vendor | undefined {
      return database
        .prepare(
          `
            SELECT id, name, website, description, source_url AS sourceUrl,
              source_page AS sourcePage, created_at AS createdAt,
              updated_at AS updatedAt, refreshed_at AS refreshedAt
            FROM vendors WHERE id = ?
          `,
        )
        .get(id) as Vendor | undefined;
    },
    updateVendor(id: string, draft: Draft): void {
      database
        .prepare(
          `
            UPDATE vendors SET name = @name, website = @website,
              description = @description, updated_at = CURRENT_TIMESTAMP
            WHERE id = @id
          `,
        )
        .run({ ...draft, id });
    },
    refreshVendor(id: string, draft: Draft): void {
      database
        .prepare(
          `
            UPDATE vendors SET name = @name, website = @website, description = @description,
              refreshed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = @id
          `,
        )
        .run({ ...draft, id });
    },
    insertVendorIfNotExists(vendor: SeedVendor): void {
      database
        .prepare(
          `
            INSERT OR IGNORE INTO vendors (id, name, website, description, source_url, source_page)
            VALUES (@id, @name, @website, @description, @sourceUrl, @sourcePage)
          `,
        )
        .run(vendor);
    },
  };
}

export function createLazyVendorRepository(): VendorRepository {
  return {
    listVendors(search = "") {
      return createVendorRepository(getDb()).listVendors(search);
    },
    getVendor(id: string) {
      return createVendorRepository(getDb()).getVendor(id);
    },
    updateVendor(id: string, draft: Draft) {
      createVendorRepository(getDb()).updateVendor(id, draft);
    },
    refreshVendor(id: string, draft: Draft) {
      createVendorRepository(getDb()).refreshVendor(id, draft);
    },
    insertVendorIfNotExists(vendor: SeedVendor) {
      createVendorRepository(getDb()).insertVendorIfNotExists(vendor);
    },
  };
}

let databaseInstance: Database.Database | undefined;

export function getDb(): Database.Database {
  if (!databaseInstance) {
    databaseInstance = createDatabase();
  }
  return databaseInstance;
}

export function listVendors(search = ""): Vendor[] {
  return createLazyVendorRepository().listVendors(search);
}

export function getVendor(id: string): Vendor | undefined {
  return createLazyVendorRepository().getVendor(id);
}

export function updateVendor(id: string, draft: Draft): void {
  createLazyVendorRepository().updateVendor(id, draft);
}

export function refreshVendor(id: string, draft: Draft): void {
  createLazyVendorRepository().refreshVendor(id, draft);
}

export function insertVendorIfNotExists(vendor: SeedVendor): void {
  createLazyVendorRepository().insertVendorIfNotExists(vendor);
}

export const db = new Proxy({} as Database.Database, {
  get(_target, property, receiver) {
    const activeDatabase = getDb();
    const value = Reflect.get(activeDatabase as object, property, receiver);
    return typeof value === "function" ? value.bind(activeDatabase) : value;
  },
  set(_target, property, value) {
    const activeDatabase = getDb();
    return Reflect.set(activeDatabase as object, property, value);
  },
});
