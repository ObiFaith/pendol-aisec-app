
import { chromium } from "playwright";
import * as cheerio from "cheerio";

async function scrape(url: string) {
  const browser = await chromium.launch({
    headless: false,        // try headed first; then try headless again
    channel: "chrome",      // your installed Chrome instead of bundled Chromium
  });
  try {
    const page = await browser.newPage();
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    console.log("initial status:", response?.status());

    // wait for the checkpoint to clear and real content to appear
    await page
      .waitForFunction(() => !document.body.innerText.includes("Security Checkpoint"), null, { timeout: 30000 })
      .catch(() => console.warn("checkpoint did not clear"));
    await page.waitForLoadState("networkidle");

    const html = await page.content();
    console.log("still on checkpoint?", /security checkpoint/i.test(html));
    return cheerio.load(html)("a").length;
  } finally {
    await browser.close();
  }
}

console.log(
  await scrape("https://cybersectools.com/categories/ai-security")
);



