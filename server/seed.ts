import { mkdirSync } from "node:fs";
import { closeBrowser } from "../server/playwrightFetch.js";
import { createDatabase, createVendorRepository } from "./db.js";
import { SeedVendor, PAGES } from "../types";
import { slugFromUrl, writeJson } from "./utils";
import { scrapeCategoryPage, dedupeTools, collectVendors } from "./utils";

function seedDatabase(vendors: SeedVendor[]): void {
  const db = createDatabase();
  const repo = createVendorRepository(db);

  const seedAll = db.transaction((items: SeedVendor[]) => {
    for (const vendor of items) {
      repo.insertVendorIfNotExists(vendor);
    }
  });

  seedAll(vendors);
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

    seedDatabase(vendors);

    console.log(
      `Seeding complete: ${vendors.length} vendors saved to data/vendors.json and the database`,
    );
  } finally {
    await closeBrowser();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
