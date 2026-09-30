import { db } from "./db.js";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

type SeedVendor = {
  id: string;
  name: string;
  website: string;
  description: string;
  sourceUrl: string;
  sourcePage: 1 | 2;
};

const seedPath = resolve(process.cwd(), "data", "vendors.json");
const vendors = JSON.parse(readFileSync(seedPath, "utf8")) as SeedVendor[];
const insert = db.prepare(`
  INSERT OR IGNORE INTO vendors (id, name, website, description, source_url, source_page)
  VALUES (@id, @name, @website, @description, @sourceUrl, @sourcePage)
`);
const seed = db.transaction((records: SeedVendor[]) => {
  for (const record of records) insert.run(record);
});

seed(vendors);
console.log(
  `Seeded ${vendors.length} distinct vendor records from the saved category snapshots.`,
);
