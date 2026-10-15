import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

export async function get(
  url: string,
  delayMs = 0,
  retries = 4,
): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    const response = await playwrightFetchPage(new URL(url));

    if (response.status === 429 && attempt < retries) {
      const wait = 30_000 * 2 ** attempt; // 30s, 60s, 120s, 240s
      console.warn(`429 for ${url}, retrying in ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}. Stopping.`);
    }

    const html = await response.text();
    if (delayMs > 0) await sleep(delayMs);
    return html;
  }
}

const comparable = (data: unknown): string =>
  JSON.stringify(data, (key, value) =>
    key === "retrievedAt" ? undefined : value,
  );

function readJson(path: string): unknown {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : undefined;
}

export function writeJson(filename: string, data: unknown): void {
  const path = join("data", filename);
  const existing = readJson(path);

  if (existing !== undefined && comparable(existing) === comparable(data)) {
    return;
  }

  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function formatRefreshFailure(status: number): string {
  switch (status) {
    case 429:
      return "CybersecTools is rate-limiting requests right now. Please wait a moment and try again.";
    case 403:
      return "CybersecTools is blocking requests from this environment. Please try again later.";
    default:
      return `CybersecTools returned HTTP ${status}`;
  }
}
