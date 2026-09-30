import * as cheerio from "cheerio";

export type VendorSourceRecord = {
  name: string;
  website: string;
  description: string;
  companyProfileUrl: string | null;
};

function cleanText(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function parseCybersecToolsTool(html: string): VendorSourceRecord {
  const $ = cheerio.load(html);
  const companyLink = $("a[href^='/companies/']")
    .filter((_, element) => /^By\s+/i.test(cleanText($(element).text())))
    .first();
  const h1 = cleanText($("h1").first().text());
  const byLine = cleanText(companyLink.text()).replace(/^By\s+/i, "");
  const description = cleanText(
    $("meta[property='og:description']").attr("content") ??
      $("meta[name='description']").attr("content") ??
      $("main p").first().text(),
  );
  const websiteLink = $("a")
    .filter((_, element) => /visit website/i.test(cleanText($(element).text())))
    .first();
  const website = websiteLink.attr("href") ?? "";

  return {
    name:
      byLine || h1 || cleanText($("meta[property='og:title']").attr("content")),
    website,
    description,
    companyProfileUrl: companyLink.attr("href") ?? null,
  };
}
