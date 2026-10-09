import { mkdirSync } from "node:fs";
import Database from "better-sqlite3";
import { dirname, resolve } from "node:path";
import { Draft, SeedVendor, Vendor } from "../src/types";

const databasePath = resolve(process.cwd(), "data", "vendors.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.exec(`
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

export function listVendors(search = ""): Vendor[] {
  const pattern = `%${search.trim()}%`;
  return db
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
}

export function getVendor(id: string): Vendor | undefined {
  return db
    .prepare(
      `
    SELECT id, name, website, description, source_url AS sourceUrl,
      source_page AS sourcePage, created_at AS createdAt,
      updated_at AS updatedAt, refreshed_at AS refreshedAt
    FROM vendors WHERE id = ?
  `,
    )
    .get(id) as Vendor | undefined;
}

export function updateVendor(id: string, draft: Draft): void {
  db.prepare(
  `
    UPDATE vendors SET name = @name, website = @website,
      description = @description, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `,
  ).run({ ...draft, id });
}

export function refreshVendor(id: string, draft: Draft): void {
  db.prepare(
  `
    UPDATE vendors SET name = @name, website = @website, description = @description,
      refreshed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `,
  ).run({ ...draft, id });
}

export function insertVendorIfNotExists(vendor: SeedVendor): void {
  db.prepare(
  `
    INSERT OR IGNORE INTO vendors (id, name, website, description, source_url, source_page)
    VALUES (@id, @name, @website, @description, @sourceUrl, @sourcePage)
  `,
  ).run(vendor);
}
