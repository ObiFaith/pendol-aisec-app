import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { eq, or, sql } from "drizzle-orm";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { Draft, SeedVendor, Vendor } from "../../types";
import * as schema from "./schema.js";
import { vendors } from "./schema.js";

export type Db = BetterSQLite3Database<typeof schema>;

const MIGRATIONS_FOLDER = resolve(process.cwd(), "drizzle");

export function createDatabase(
  databasePath = resolve(process.cwd(), "data", "vendors.sqlite"),
): Db {
  mkdirSync(dirname(databasePath), { recursive: true });

  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");

  const database = drizzle(sqlite, { schema });

  // Replaces the old CREATE TABLE IF NOT EXISTS block.
  migrate(database, { migrationsFolder: MIGRATIONS_FOLDER });

  return database;
}

export type VendorRepository = {
  listVendors: (search?: string) => Vendor[];
  getVendor: (id: string) => Vendor | undefined;
  updateVendor: (id: string, draft: Draft) => void;
  refreshVendor: (id: string, draft: Draft) => void;
  insertVendorIfNotExists: (vendor: SeedVendor) => void;
  insertVendorsIfNotExist: (items: SeedVendor[]) => void;
};

const toInsertRow = (vendor: SeedVendor) => ({
  id: vendor.id,
  name: vendor.name,
  website: vendor.website,
  description: vendor.description,
  sourceUrl: vendor.sourceUrl,
  sourcePage: vendor.sourcePage,
});

export function createVendorRepository(database: Db): VendorRepository {
  return {
    listVendors(search = "") {
      const term = search.trim();
      const pattern = `%${term}%`;

      const where =
        term === ""
          ? undefined
          : or(
              sql`${vendors.name} LIKE ${pattern} COLLATE NOCASE`,
              sql`${vendors.website} LIKE ${pattern} COLLATE NOCASE`,
              sql`${vendors.description} LIKE ${pattern} COLLATE NOCASE`,
            );

      return database
        .select()
        .from(vendors)
        .where(where)
        .orderBy(sql`${vendors.name} COLLATE NOCASE`)
        .all() as Vendor[];
    },

    getVendor(id: string): Vendor | undefined {
      return database
        .select()
        .from(vendors)
        .where(eq(vendors.id, id))
        .get() as Vendor | undefined;
    },

    updateVendor(id: string, draft: Draft): void {
      database
        .update(vendors)
        .set({
          name: draft.name,
          website: draft.website,
          description: draft.description,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(vendors.id, id))
        .run();
    },

    refreshVendor(id: string, draft: Draft): void {
      database
        .update(vendors)
        .set({
          name: draft.name,
          website: draft.website,
          description: draft.description,
          refreshedAt: sql`CURRENT_TIMESTAMP`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(vendors.id, id))
        .run();
    },

    insertVendorIfNotExists(vendor: SeedVendor): void {
      database
        .insert(vendors)
        .values(toInsertRow(vendor))
        .onConflictDoNothing()
        .run();
    },

    // One transaction: every insert is "INSERT ... ON CONFLICT DO NOTHING",
    // and if anything throws, the whole batch is rolled back.
    insertVendorsIfNotExist(items: SeedVendor[]): void {
      database.transaction((tx) => {
        for (const vendor of items) {
          tx.insert(vendors)
            .values(toInsertRow(vendor))
            .onConflictDoNothing()
            .run();
        }
      });
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
    insertVendorsIfNotExist(items: SeedVendor[]) {
      createVendorRepository(getDb()).insertVendorsIfNotExist(items);
    },
  };
}

let databaseInstance: Db | undefined;

export function getDb(): Db {
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

export function insertVendorsIfNotExist(items: SeedVendor[]): void {
  createLazyVendorRepository().insertVendorsIfNotExist(items);
}

export const db = new Proxy({} as Db, {
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
