import {
  CategoryListing,
  CategoryPage,
  PAGES,
  SeedVendor,
  SourcePage,
} from "../../types";
import { parseCybersecToolsTool } from "../source";
import { cleanText, get, slugFromUrl } from "../utils";

export const toVendorId = (companyName: string): string =>
  cleanText(companyName)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/[\s-]+/g, "-");

export function dedupeTools(pages: CategoryPage[]) {
  const unique = new Map<
    string,
    { listing: CategoryListing; sourcePage: SourcePage }
  >();

  pages.forEach((page, index) => {
    for (const listing of page.listings) {
      const slug = slugFromUrl(listing.toolUrl);
      if (slug && !unique.has(slug)) {
        unique.set(slug, { listing, sourcePage: PAGES[index] });
      }
    }
  });

  return unique;
}

const limit = Number(process.env.SEED_LIMIT ?? Infinity);

export async function collectVendors(
  tools: ReturnType<typeof dedupeTools>,
): Promise<SeedVendor[]> {
  const vendors = new Map<string, SeedVendor>();

  // Sequential on purpose: polite 3s delay between detail-page requests.
  for (const [slug, { listing, sourcePage }] of [...tools].slice(0, limit)) {
    const sourceUrl = listing.toolUrl;
    const { name, website, description } = parseCybersecToolsTool(
      await get(sourceUrl, 3000),
    );

    if (!name || !website || !description) {
      console.warn("Incomplete vendor data, skipped:", slug);
      continue;
    }

    const id = toVendorId(name);

    if (vendors.has(id)) {
      console.log(`Vendor already collected (${id}), skipped tool: ${slug}`);
      continue;
    }

    vendors.set(id, {
      id,
      name: cleanText(name),
      website,
      description,
      sourceUrl,
      sourcePage,
    });
    console.log("Collected vendor:", id);
  }

  return [...vendors.values()];
}
