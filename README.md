# AI Security Vendor Register

A local React and TypeScript application for searching, viewing, editing, and refreshing AI security vendor records collected from [CybersecTools](https://cybersectools.com/categories/ai-security) (pages 1 and 2).

---

## How to Run

### Prerequisites
- **Node.js**: v20 or later
- **npm**: v10 or later
- **Playwright Chromium**: Browser binary required for upstream scraping

### Setup and Start

1. **Install dependencies**:
   ```sh
   npm ci
   npx playwright install chromium
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory (or use an existing one) containing a PostgreSQL connection string:
   ```env
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   DATABASE_SSL=true
   PLAYWRIGHT_HEADLESS=true
   ```

3. **Run Database Migrations & Seed**:
   ```sh
   npm run db:migrate   # Apply Drizzle migrations to PostgreSQL
   npm run seed         # Scrape pages 1 & 2, deduplicate, and populate database
   ```

4. **Start Local Development Server**:
   ```sh
   npm run dev
   ```
   This concurrently starts:
   - **Frontend (Vite)** at `http://localhost:5173`
   - **Backend (Express)** at `http://localhost:3001` (Vite proxies `/api` calls)

### Checks and Tests
```sh
npm test         # Run all isolated unit & integration tests (Vitest)
npm run build    # Strict TypeScript compiler check (tsc -b) & Vite bundle
```

---

## Stack Chosen and Why

- **Frontend: React 19 + TypeScript + Vite 7** — High-performance reactive UI with instant Hot Module Replacement (HMR) and compile-time type safety.
- **Backend: Express 5 (Node.js ESM) + `tsx`** — Fast, unopinionated REST API service running native TypeScript without cumbersome transpilation steps.
- **Database & ORM: PostgreSQL via `pg` + Drizzle ORM & Drizzle Kit** — Strong relational schema guarantees, full type safety from SQL to TypeScript, and version-controlled migration files in `server/database/migrations/`.
- **Upstream Scraping: Playwright (Chromium) + Cheerio** — CybersecTools uses Vercel Edge Firewall with JavaScript challenge mode (`x-vercel-mitigated: challenge`), returning HTTP 429 to standard HTTP clients. Playwright evaluates the challenge and navigates to the resolved DOM, while Cheerio provides fast, deterministic HTML parsing.
- **Validation: Zod 4** — Runtime schema validation at API boundaries (`PUT /api/vendors/:id`) ensuring data integrity before persistence.
- **Testing: Vitest 5 + PGlite (`@electric-sql/pglite`)** — Lightning-fast, isolated test execution. PGlite provides an in-process, in-memory PostgreSQL engine so SQL repository integration tests run offline without connecting to external databases.
- **Styling: Vanilla CSS & Lucide React** — Custom glassmorphism dark theme using CSS custom properties (`src/styles.css`) for high visual quality without heavy utility framework overhead.

---

## What Was Built vs. What Was Left Out

### What Was Built
- **Vendor Collection & Deduplication Pipeline**: Scrapes listings across pages 1 and 2 of CybersecTools, consolidating multiple product listings from the same organization into a single normalized vendor company entry.
- **PostgreSQL Database Storage**: Schema-managed `vendors` table persisted with Drizzle ORM, supporting idempotent seeding (`ON CONFLICT DO NOTHING`) and atomic updates.
- **RESTful API**:
  - `GET /api/vendors?q=`: Debounced search across vendor name, website, and description.
  - `GET /api/vendors/:id`: Retrieve single vendor metadata.
  - `PUT /api/vendors/:id`: Update editable fields with Zod validation.
  - `POST /api/vendors/:id/refresh`: Refresh record from live CybersecTools source.
- **Interactive Single-Page UI**:
  - Real-time search with 300ms debounce.
  - Category filter tabs (`All`, `Page 1`, `Page 2`).
  - Slide-out vendor detail and edit drawer.
  - In-place field editing with immediate validation feedback and persistence notices.
  - One-click source refresh with active loading spinners and rate-limit error toasts.
- **Resilient Upstream Fetcher & All-or-Nothing Safety**: Headless browser loader with a serialized queue preventing concurrency overload. Refreshes only apply if the upstream fetch succeeds and contains all required fields (`name`, `website`, `description`); if rate-limited or blocked, existing data is strictly preserved.
- **Isolated Vitest Test Suite**: 34 automated unit and integration tests across 4 test suites verifying repository SQL logic, API routes, parsing edge cases, and refresh safety.

### What Was Left Out
- **Authentication & Authorization**: Omitted intentionally to keep the evaluation register lightweight and simple for local use.
- **Server-Side Pagination**: With ~20 distinct vendors across the first two category pages, in-memory client filtering delivers instant (<1ms) interactions without extra roundtrips.
- **Scheduled Background Refresh Daemon**: Refreshes remain user-initiated to avoid generating unwanted automated traffic against the source site.
- **Multi-User Optimistic Concurrency**: Simultaneous writes use last-write-wins; record versioning/ETags were omitted as out of scope for a single-user evaluation tool.

---

## Key Decision and Alternative Considered

- **Decision**: Normalizing and deduplicating records at the **vendor (company)** level rather than the **tool (product)** level.
- **Alternative Considered**: Creating a distinct database entry for every individual product card listed on CybersecTools.
- **Why Chosen**: The objective is to produce a register of AI security *vendors*. Marketplaces like CybersecTools frequently feature multiple distinct products from the same vendor (e.g., consolidating multiple Agentic Fabriq products under one company profile). Storing records by company slug eliminates clutter and duplicate entries while retaining a representative product tool link as the source reference.

---

## How the Application Was Verified

### 1. Automated Test Suites (`npm test`)
- **Repository Integration (`repository.test.ts`)**: Ran real SQL queries against an in-memory PGlite instance to verify case-insensitive search, case-insensitive alphabetical sorting, idempotent inserts, and `refreshedAt` timestamp updates.
- **Route Handlers (`index.test.ts`)**: Verified `GET`, `PUT`, and `POST` API behavior, HTTP status codes, Zod validation rejections (400), and rate-limit error formatting (429).
- **Refresh Safety (`refresh.test.ts`)**: Tested all-or-nothing guarantees: 429 rate limits, 502 upstream errors, and 422 incomplete DOMs all preserve existing database fields untouched.
- **Cheerio Parser (`source.test.ts`)**: Verified extraction of company byline, heading fallbacks, description resolution, and stripping of tracking query params (`utm_source`, `utm_medium`).
- **Database Safety Guard (`setup.ts`)**: Global Vitest hook mocks `pg.Pool` to ensure tests never open live network sockets to real databases.

### 2. Strict Build & Type Check (`npm run build`)
- Executed `tsc -b` and `vite build` to guarantee zero TypeScript type errors, correct import paths, and a clean production asset bundle in `dist/`.

### 3. Manual Interactive Verification
- Tested debounced search and category filter tabs across All, Page 1, and Page 2.
- Selected vendors, modified name, website, and description fields, and saved changes to confirm persistence across page reloads.
- Tested invalid URLs in the edit form to verify inline Zod validation error messages.
- Triggered **Refresh from source** on vendor records to confirm loading indicators, successful field updates, and graceful error notifications when upstream challenges occur.
- Verified that failed or challenged refreshes never clear or corrupt existing vendor data.

---

## Known Limitation and What to Improve Next

### The Known Limitation
CybersecTools enforces **Vercel Edge Firewall Challenge Mode** and aggressive rate limiting on repeated requests. While Playwright Chromium navigates the JavaScript challenge, frequent requests can trigger temporary 429 checkpoints or navigation timeouts. In addition, launching Chromium introduces cold-start latency (~1–2 seconds) and higher memory overhead compared to lightweight HTTP requests.

### What to Improve Next
1. **Response Caching with TTL**: Introduce a server-side cache (e.g. Redis or in-memory LRU) for fetched tool pages with a reasonable time-to-live (e.g. 1 hour) to minimize browser executions for repeated refreshes.
2. **Dedicated Anti-Bot Scraping Proxy**: In production, route upstream requests through an edge-unblocking proxy (such as ScrapingBee or Bright Data). This removes the need for local Chromium binaries on server hosts and eliminates edge firewall challenges.
3. **Pre-Save Visual Diff Modal**: Add a side-by-side comparison modal in the UI displaying the existing vendor details versus newly fetched upstream values, allowing users to review and selectively accept refreshed changes before writing to the database.

---

## AI Assistance and Verification

- **Where Used**:
  - Scaffolding initial project layout, TypeScript configurations, and Drizzle ORM schema definitions.
  - Drafting Cheerio selector heuristics for tool details and category card DOM structures.
  - Designing CSS custom properties and responsive split-pane layout styling in `src/styles.css`.
  - Scaffolding Vitest test cases and mock stubs in `server/__test__/testUtils.ts`.
- **How Verified**:
  - Audited all generated TypeScript code line-by-line for type safety, edge-case coverage, and security boundaries.
  - Verified strict TypeScript compliance using `npm run build` (`tsc -b`).
  - Implemented comprehensive offline Vitest test suites with PGlite to validate real database queries and Express routes without external network dependencies.
  - Performed manual end-to-end testing in the browser to confirm UX responsiveness, form validation, and data persistence.
