import * as cheerio from "cheerio";
import { CategoryListing, CategoryPage, Vendor } from "../../types";
import {
  categoryFile,
  cleanText,
  get,
  pageUrl,
  slugFromUrl,
  writeJson,
} from "../utils";

const BASE = "https://cybersectools.com";

export function extractListings(html: string): CategoryListing[] {
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

export async function scrapeCategoryPage(
  page: Vendor["sourcePage"],
): Promise<CategoryPage> {
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
