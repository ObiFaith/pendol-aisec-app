import { mkdirSync } from "node:fs";
import { PAGES, SeedVendor } from "../types";
import { slugFromUrl, writeJson } from "./utils";
import { closeBrowser } from "../server/playwrightFetch.js";
import { collectVendors, dedupeTools, scrapeCategoryPage } from "./utils";
import {
  closeDatabase,
  createVendorRepository,
  getDb,
  runMigrations,
} from "./database";

async function seedDatabase(vendors: SeedVendor[]): Promise<void> {
  const db = getDb();
  await runMigrations(db);
  await createVendorRepository(db).insertVendorsIfNotExist(vendors);
}

async function main(): Promise<void> {
  mkdirSync("data", { recursive: true });

  try {
    const [first, second] = await Promise.all(PAGES.map(scrapeCategoryPage));
    const firstSlugs = new Set(
      first.listings.map((l) => slugFromUrl(l.toolUrl)),
    );
    if (
      second.listings.length > 0 &&
      second.listings.every((l) => firstSlugs.has(slugFromUrl(l.toolUrl)))
    ) {
      throw new Error(
        "Page 2 contains only page 1 tools. Verify the pagination URL.",
      );
    }

    const unique = dedupeTools([first, second]);
    console.log(`Unique tools across both pages: ${unique.size}`);

    const vendors = await collectVendors(unique);
    writeJson("vendors.json", vendors);

    await seedDatabase(vendors);

    console.log(
      `Seeding complete: ${vendors.length} vendors saved to data/vendors.json and the database`,
    );
  } finally {
    await closeBrowser();
    await closeDatabase();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
