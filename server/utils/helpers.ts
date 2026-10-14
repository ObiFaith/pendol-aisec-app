import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { playwrightFetchPage } from "../../server/playwrightFetch";

const BASE = "https://cybersectools.com";
const CATEGORY_URL = `${BASE}/categories/ai-security`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const cleanText = (value: string | undefined): string =>
  (value ?? "").replace(/\s+/g, " ").trim();

export const slugFromUrl = (toolUrl: string): string =>
  new URL(toolUrl).pathname.replace(/^\/tools\//, "").replace(/\/$/, "");

export const pageUrl = (page: 1 | 2 = 1): string =>
  page > 1 ? `${CATEGORY_URL}?page=${page}` : CATEGORY_URL;

export const categoryFile = (page: 1 | 2 = 1): string =>
  `categories-page-${page}.json`;

export async function get(url: string, delayMs = 0): Promise<string> {
  const response = await playwrightFetchPage(new URL(url));

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}. Stopping.`);
  }

  const html = await response.text();
  if (delayMs > 0) await sleep(delayMs);

  return html;
}

// Overwrites the file if it already exists.
export function writeJson(filename: string, data: unknown): void {
  writeFileSync(
    join("data", filename),
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8",
  );
}
