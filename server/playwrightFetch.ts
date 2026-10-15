import { chromium, type Browser } from "playwright";
import { FetchPage } from "../types";

let browserPromise: Promise<Browser> | undefined;

function getBrowser() {
  browserPromise ??= chromium
    .launch({ headless: process.env.PLAYWRIGHT_HEADLESS !== "false" })
    .then((browser) => {
      browser.on("disconnected", () => (browserPromise = undefined));
      return browser;
    });
  return browserPromise;
}

export async function closeBrowser() {
  if (browserPromise) await (await browserPromise).close();
  browserPromise = undefined;
}

async function load(url: URL) {
  const context = await (await getBrowser()).newContext();
  try {
    const page = await context.newPage();
    const res = await page.goto(url.href, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    const status = res?.status() ?? 0;
    const html = await page.content();
    if (status === 429 || /security checkpoint/i.test(html)) {
      return { ok: false, status: 429, text: async () => "" };
    }
    return { ok: status >= 200 && status < 300, status, text: async () => html };
  } finally {
    await context.close();
  }
}

let queue: Promise<unknown> = Promise.resolve();
export const playwrightFetchPage: FetchPage = (url) => {
  const run = queue.then(() => load(url));
  queue = run.catch(() => undefined);
  return run;
};
