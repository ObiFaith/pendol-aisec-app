import * as cheerio from "cheerio";
import { mkdirSync } from "node:fs";
import { closeBrowser } from "../server/playwrightFetch.js";
import { parseCybersecToolsTool } from "../server/source.js";
import { createDatabase, createVendorRepository } from "./db.js";
import { SeedVendor, CategoryListing, CategoryPage } from "../src/types";
import {
  categoryFile,
  cleanText,
  get,
  pageUrl,
  slugFromUrl,
  writeJson,
} from "./utils.js";

const BASE = "https://cybersectools.com";
const PAGES = [1, 2] as const;
type SourcePage = (typeof PAGES)[number];

const limit = Number(process.env.SEED_LIMIT ?? Infinity);

function extractListings(html: string): CategoryListing[] {
  const $ = cheerio.load(html);
  const listings: CategoryListing[] = [];
  const seen = new Set<string>();

  $('a.font-semibold[href^="/tools/"]').each((_, element) => {
    const anchor = $(element);
    const href = anchor.attr("href");
    if (!href) return;

    const toolUrl = new URL(href, BASE).href;
    const slug = slugFromUrl(toolUrl);
    if (!slug || seen.has(slug)) return;

    const name = cleanText(anchor.text());
    if (!name) return;
    seen.add(slug);

    let description = "";
    let ancestor = anchor.parent();

    for (let depth = 0; depth < 6 && ancestor.length; depth++) {
      const toolLinks = ancestor.find(
        'a.font-semibold[href^="/tools/"]',
      ).length;

      if (toolLinks <= 1) {
        const paragraphs = ancestor
          .find("p")
          .map((_, p) => cleanText($(p).text()))
          .get()
          .filter((text) => text && text !== name);

        if (paragraphs.length > 0) {
          description = paragraphs[0];
          break;
        }
      }

      ancestor = ancestor.parent();
    }

    listings.push({ name, description, toolUrl });
  });

  return listings;
}

async function scrapeCategoryPage(page: SourcePage): Promise<CategoryPage> {
  const sourceUrl = pageUrl(page);
  const listings = extractListings(await get(sourceUrl));

  const data: CategoryPage = {
    sourceUrl,
    retrievedAt: new Date().toISOString(),
    note: `AI Security category listings retrieved from page ${page}.`,
    listings,
  };

  writeJson(categoryFile(page), data);
  console.log(`Category page ${page}: ${listings.length} tools`);

  return data;
}

function dedupeListings(pages: CategoryPage[]) {
  const unique = new Map<
    string,
    { listing: CategoryListing; sourcePage: SourcePage }
  >();

  pages.forEach((page, index) => {
    for (const listing of page.listings) {
      const slug = slugFromUrl(listing.toolUrl);
      if (!unique.has(slug)) {
        unique.set(slug, { listing, sourcePage: PAGES[index] });
      }
    }
  });

  return unique;
}

async function collectVendors(
  unique: ReturnType<typeof dedupeListings>,
): Promise<SeedVendor[]> {
  const vendors: SeedVendor[] = [];

  // Sequential on purpose: polite 3s delay between detail-page requests.
  for (const [slug, { listing, sourcePage }] of [...unique].slice(0, limit)) {
    const sourceUrl = listing.toolUrl;
    const { name, website, description } = parseCybersecToolsTool(
      await get(sourceUrl, 3000),
    );

    if (!name || !website || !description) {
      console.warn("Incomplete vendor data, skipped:", slug);
      continue;
    }

    vendors.push({
      id: slug,
      name,
      website,
      description,
      sourceUrl,
      sourcePage,
    });
    console.log("Collected vendor:", slug);
  }

  return vendors;
}

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

    const unique = dedupeListings([first, second]);
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
