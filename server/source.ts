import * as cheerio from "cheerio";

export type VendorSourceRecord = {
  name: string;
  website: string;
  description: string;
};

function cleanText(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function cleanWebsite(href: string | undefined): string {
  if (!href) return "";
  try {
    const url = new URL(href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    url.searchParams.delete("utm_source");
    url.searchParams.delete("utm_medium");
    return url.toString();
  } catch {
    return ""; // relative or malformed: treated as missing, so refresh returns 422
  }
}

export function parseCybersecToolsTool(html: string): VendorSourceRecord {
  const $ = cheerio.load(html);

  const companyLink = $("a[href^='/companies/']")
    .filter((_, el) => /^By\s+/i.test(cleanText($(el).text())))
    .first();
  const h1 = $("h1").first();
  const byLine = cleanText(companyLink.text()).replace(/^By\s+/i, "");

  // On-page text first so it matches what the list page shows
  const description = cleanText(
    h1.nextAll("p").first().text() ||
      $("meta[property='og:description']").attr("content") ||
      $("meta[name='description']").attr("content"),
  );

  const websiteLink = $("a")
    .filter((_, el) => /visit website/i.test(cleanText($(el).text())))
    .first();

  return {
    name: byLine || cleanText(h1.text()),
    website: cleanWebsite(websiteLink.attr("href")),
    description,
  };
}
