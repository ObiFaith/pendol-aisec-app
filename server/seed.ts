import { PAGES } from "../types";
import { mkdirSync } from "node:fs";
import { slugFromUrl, writeJson } from "./utils";
import { closeBrowser } from "../server/playwrightFetch.js";
import { collectVendors, dedupeTools, scrapeCategoryPage } from "./utils";
import {
  closeDatabase,
  createVendorRepository,
  getDb,
  runMigrations,
} from "./database";

async function main(): Promise<void> {
  mkdirSync("data", { recursive: true });

  try {
    const db = getDb();
    await runMigrations(db);
    const repo = createVendorRepository(db);

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

    const existing = new Set(
      (await repo.listVendors()).map((v) => v.sourceUrl),
    );

    const added = await collectVendors(unique, {
      skipUrls: existing,
      onVendor: (v) => repo.insertVendorIfNotExists(v),
    });

    const all = await repo.listVendors();
    writeJson(
      "vendors.json",
      all.map(({ id, name, website, description, sourceUrl, sourcePage }) => ({
        id,
        name,
        website,
        description,
        sourceUrl,
        sourcePage,
      })),
    );

    console.log(
      `Seeding complete: ${added.length} new vendors, ${all.length} total in the database`,
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
