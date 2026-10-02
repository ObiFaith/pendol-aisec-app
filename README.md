# AI Security Vendor Register

A local React and TypeScript application for searching, viewing, editing, and refreshing AI security vendor records collected from [CybersecTools](https://cybersectools.com/categories/ai-security).

---

## How to Run

### Setup and Start
```sh
npm install      # Install dependencies
npm run seed     # Populate SQLite database from data/vendors.json
npm run dev      # Start frontend (port 5173) and Express API (port 3001)
```

Open `http://localhost:5173` in your browser.

### Checks & Tests
```sh
npm test         # Run unit tests (server/source.test.ts & server/index.test.ts)
npm run build    # Strict TypeScript check and Vite production build
```

---

## Stack Chosen and Why

- **Frontend: React 19 + TypeScript + Vite** — High-performance, reactive UI development with fast hot module replacement (HMR) and strong type safety.
- **Backend: Express 5 (Node.js)** — Minimal, lightweight JSON REST API with zero unnecessary overhead.
- **Database: SQLite via `better-sqlite3`** — Embedded, zero-configuration relational storage with WAL mode enabled. Persists edits locally in `data/vendors.sqlite` without requiring a separate database server.
- **Parsing & Validation: Cheerio & Zod** — Fast server-side HTML scraping with Cheerio; runtime request validation and schema constraints with Zod.
- **UI & Icons: Vanilla CSS & Lucide React** — Clean, custom responsive design with a curated dark theme and accessible icons.

---

## What Was Built vs. What Was Left Out

### What Was Built
- **Vendor Collection & Deduplication**: Extracted distinct AI security vendors from pages 1 and 2 of CybersecTools with company name, website, description, and source link.
- **SQLite Persistence & Seed Script**: Idempotent database initialization (`INSERT OR IGNORE`) preventing overwrites of user edits.
- **REST API**: Endpoints for listing/searching (`GET /api/vendors`), viewing (`GET /api/vendors/:id`), editing (`PUT /api/vendors/:id`), and refreshing (`POST /api/vendors/:id/refresh`).
- **Interactive UI**: Search bar, category page filters (All / Page 1 / Page 2), detail drawer, inline field editing with validation, save feedback, and source refresh trigger.
- **Rate-Limit Resilience**: Safe error handling and user feedback when upstream requests are challenged.

### What Was Left Out
- **Authentication & User Accounts**: Left out intentionally; designed as a local single-user evaluation tool.
- **Server-Side Pagination**: With 20 distinct vendors across the first two category pages, client-side filtering delivers instant, responsive search without extra network hops.
- **Background Scraper Daemon**: Avoided heavy browser runtime daemons (Chromium) to keep setup fast and lightweight.

---

## Key Decision and Alternative Considered

- **Decision**: Deduplicating multiple product listings under a single vendor record (e.g., consolidating multiple Agentic Fabriq products into one company entry with a representative source URL).
- **Alternative Considered**: Creating an independent vendor entry for every product card on CybersecTools.
- **Why**: The objective was to catalog *vendors* (companies). Cybersecurity marketplaces frequently list multiple products from the same organization. Normalizing at the company level prevents clutter and duplication while keeping a direct link to a representative product page.

---

## How the Application Was Verified

1. **Automated Tests**: Ran `npm test` to verify the Cheerio HTML extractor (`server/source.test.ts`) and rate-limit error formatting (`server/index.test.ts`).
2. **Build & Type Check**: Ran `npm run build` (`tsc -b` and Vite bundle) to confirm strict TypeScript compliance.
3. **Manual Flow Testing**:
   - Verified live search and page filtering (Page 1 vs. Page 2).
   - Edited company names, websites, and descriptions, saved them, and reloaded to confirm persistence in `data/vendors.sqlite`.
   - Tested invalid URLs to verify Zod validation error messages.
   - Tested the **Refresh from source** button to confirm loading states, error toasts, and database safety when upstream blocks requests.
   - Cross-checked UI records against manual screenshots in `source_pages/`.

---

## Known Limitation & How It Would Be Handled with More Time

### The Limitation
CybersecTools is hosted on Vercel with **Edge Firewall / Attack Challenge Mode** enabled (`x-vercel-mitigated: challenge`). When the backend performs a raw HTTP `fetch()`, Vercel returns an **HTTP 429** response containing an interactive JavaScript Web Worker challenge rather than raw HTML. The app handles this safely by alerting the user and preserving existing data, but cannot complete a live refresh through a standard Node `fetch()`.

### Improvements with More Time
1. **Headless Browser Integration (Playwright / Puppeteer Stealth)**: Replace the raw `fetch()` in `server/index.ts` with a headless browser instance capable of running Vercel's client-side JavaScript challenge and returning the fully resolved DOM to the Cheerio parser.
2. **Scraping Proxy Service**: Route upstream requests through an edge-unblocking proxy (e.g., ScrapingBee or ScraperAPI) to bypass bot challenges without running a local Chromium instance.
3. **Snapshot Reset Fallback**: Add a fallback option in the UI that restores the pristine extracted values from `data/vendors.json` if CybersecTools returns 429.

---

## AI Assistance and Verification

- **Where Used**: AI assistance was used for initial project scaffolding, CSS styling/layout structure, and Cheerio DOM selector logic.
- **How Verified**: Audited the generated code line-by-line, enforced strict TypeScript compiler checks, ran the unit test suite (`npm test`), and manually validated all interactive flows in the browser.
