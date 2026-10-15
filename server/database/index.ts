import "dotenv/config";
import { Pool } from "pg";
import { resolve } from "node:path";
import { vendors } from "./schema.js";
import * as schema from "./schema.js";
import { asc, eq, ilike, or, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { type PgDatabase, type PgQueryResultHKT } from "drizzle-orm/pg-core";
import type {
  Draft,
  SeedVendor,
  SourcePage,
  Vendor,
  VendorRepository,
} from "../../types";

export type Db = NodePgDatabase<typeof schema>;
type AnyPgDb = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS_FOLDER = resolve(process.cwd(), "server/database/migrations");

let pool: Pool | undefined;
let databaseInstance: Db | undefined;

const iso = (value: string | null): string | null =>
  value === null ? null : new Date(value).toISOString();

const toVendor = (row: typeof vendors.$inferSelect): Vendor => ({
  ...row,
  sourcePage: row.sourcePage as SourcePage,
  createdAt: iso(row.createdAt) as string,
  updatedAt: iso(row.updatedAt) as string,
  refreshedAt: iso(row.refreshedAt),
});

export function createDatabase(
  connectionString = process.env.DATABASE_URL,
): Db {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  pool = new Pool({
    connectionString,
    keepAlive: true,
    connectionTimeoutMillis: 20_000,
    idleTimeoutMillis: 0,
  });

  pool.on("error", (err) =>
    console.error("Idle pg client error:", err.message),
  );

  return drizzle(pool, { schema });
}

export function getDb(): Db {
  databaseInstance ??= createDatabase();
  return databaseInstance;
}

export async function runMigrations(database: Db = getDb()): Promise<void> {
  await migrate(database, { migrationsFolder: MIGRATIONS_FOLDER });
}

export async function closeDatabase(): Promise<void> {
  await pool?.end();
  pool = undefined;
  databaseInstance = undefined;
}

const toInsertRow = (vendor: SeedVendor) => ({
  id: vendor.id,
  name: vendor.name,
  website: vendor.website,
  description: vendor.description,
  sourceUrl: vendor.sourceUrl,
  sourcePage: vendor.sourcePage,
});

export function createVendorRepository(database: AnyPgDb): VendorRepository {
  return {
    async listVendors(search = "") {
      const term = search.trim();
      const pattern = `%${term}%`;

      const where =
        term === ""
          ? undefined
          : or(
              ilike(vendors.name, pattern),
              ilike(vendors.website, pattern),
              ilike(vendors.description, pattern),
            );

      const rows = await database
        .select()
        .from(vendors)
        .where(where)
        .orderBy(asc(sql`lower(${vendors.name})`));
      return rows.map(toVendor);
    },

    async getVendor(id) {
      const [row] = await database
        .select()
        .from(vendors)
        .where(eq(vendors.id, id))
        .limit(1);
      return toVendor(row);
    },

    async updateVendor(id, draft) {
      await database
        .update(vendors)
        .set({
          name: draft.name,
          website: draft.website,
          description: draft.description,
          updatedAt: sql`now()`,
        })
        .where(eq(vendors.id, id));
    },

    async refreshVendor(id, draft) {
      await database
        .update(vendors)
        .set({
          name: draft.name,
          website: draft.website,
          description: draft.description,
          refreshedAt: sql`now()`,
          updatedAt: sql`now()`,
        })
        .where(eq(vendors.id, id));
    },

    async insertVendorIfNotExists(vendor) {
      await database
        .insert(vendors)
        .values(toInsertRow(vendor))
        .onConflictDoNothing();
    },

    async insertVendorsIfNotExist(items) {
      if (items.length === 0) return;
      await database
        .insert(vendors)
        .values(items.map(toInsertRow))
        .onConflictDoNothing();
    },
  };
}

const repo = () => createVendorRepository(getDb());

export const listVendors = (search = "") => repo().listVendors(search);
export const getVendor = (id: string) => repo().getVendor(id);
export const updateVendor = (id: string, draft: Draft) =>
  repo().updateVendor(id, draft);
export const refreshVendor = (id: string, draft: Draft) =>
  repo().refreshVendor(id, draft);
export const insertVendorIfNotExists = (v: SeedVendor) =>
  repo().insertVendorIfNotExists(v);
export const insertVendorsIfNotExist = (items: SeedVendor[]) =>
  repo().insertVendorsIfNotExist(items);

export const db = getDb; // if other code imported `db`, switch it to `getDb()`
