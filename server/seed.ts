import { db, insertVendorIfNotExists } from "./db.js";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { SeedVendor } from "../src/types/vendor.js";

const seedPath = resolve(process.cwd(), "data", "vendors.json");
const vendors = JSON.parse(readFileSync(seedPath, "utf8")) as SeedVendor[];

const seed = db.transaction((records: SeedVendor[]) => {
  for (const record of records) {
    insertVendorIfNotExists(record);
  }
});

seed(vendors);
console.log(
  `Seeded ${vendors.length} distinct vendor records from the saved category snapshots.`,
);
