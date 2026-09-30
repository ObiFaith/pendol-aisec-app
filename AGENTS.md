# AGENTS.md

## Project Overview

Fieldnotes is a local React and TypeScript register for AI security vendors listed on the first two pages of CybersecTools' AI Security category. Users can search vendors, edit and save company fields, and refresh one record from its saved CybersecTools product page.

Keep this file synchronized with major architectural, workflow, dependency, and configuration changes. Update it in the same change when those details change.

## Stack and Structure

- React 19 with TypeScript; Vite serves the frontend.
- Express 5 provides a JSON API; `better-sqlite3` persists records in SQLite.
- Cheerio parses CybersecTools pages; Zod validates vendor updates; `lucide-react` supplies UI icons.
- `src/`: the React app (`App.tsx`), entry point (`main.tsx`), and global styling (`styles.css`).
- `server/`: Express API (`index.ts`), SQLite setup/queries (`db.ts`), seed command (`seed.ts`), source parser (`source.ts`), and parser tests.
- `data/`: category listing extracts, initial vendor records, and the runtime SQLite database.
- `source_pages/`: retained source-page screenshots.

See `README.md` for the data collection provenance and user-facing setup notes.

## Setup and Commands

Requires Node.js and npm. Install locked dependencies and seed the local database from the repository root:

```sh
npm ci
npm run seed
```

Run the app:

```sh
npm run dev
```

Vite is available at `http://localhost:5173`; Express listens on port `3001` by default. Vite proxies `/api` requests to the Express server.

Available checks and scripts:

```sh
npm test       # Run server/source.test.ts with Node's test runner through tsx
npm run build  # TypeScript project check, then production Vite build
npm run seed   # Insert missing starter vendors into SQLite
```

There are no configured lint, standalone type-check, formatting, migration, or deployment scripts. The build's `tsc -b` step performs the available TypeScript check.

## Configuration and Data

- `API_PORT` optionally changes the Express port; default is `3001`.
- The SQLite path is `data/vendors.sqlite`, resolved from the current working directory. Run npm commands from the repository root.
- No authentication or authorization middleware is currently implemented; treat this as a local development application, not a production-ready service.
- `data/category-page-1.json` and `data/category-page-2.json` are structured listing extracts, not raw HTML. `data/vendors.json` provides the initial distinct-vendor records.
- `npm run seed` uses `INSERT OR IGNORE`: it does not overwrite existing vendor edits. It is safe to rerun to add missing IDs.
- The schema is created in `server/db.ts` with `CREATE TABLE IF NOT EXISTS`; there is no migration framework. Avoid destructive schema or database changes without preserving existing records.

## Architecture and Conventions

- Keep the backend API in Express and the browser UI in React. API routes use `/api/vendors`; JSON errors have an `error` field.
- The current routes list/search vendors, retrieve one vendor, update editable fields, and refresh one vendor from CybersecTools. Keep input validation in Zod schemas at the API boundary.
- UI data access uses browser `fetch` against same-origin `/api` paths; Vite handles the development proxy. Preserve loading, success, and error feedback for asynchronous actions.
- A vendor is one distinct company, identified by its stable `id`. `sourceUrl` points to a representative CybersecTools tool page and `sourcePage` records category page 1 or 2.
- Refresh replaces the stored name, website, and description only after a successful fetch and complete parse. Keep the CybersecTools host/protocol check and avoid changing local data when upstream requests fail.
- Keep source parsing isolated in `server/source.ts` and cover parsing behavior with focused tests in `server/source.test.ts`.
- Match the existing TypeScript style: strict compiler options are enabled, unused locals/parameters are errors, and the project uses ESM imports with `.js` extensions in server TypeScript imports.
- Follow the existing single-screen UI patterns: React function components and hooks, shared styles in `src/styles.css`, and Lucide icons for controls. Avoid adding a new state, routing, or styling framework without a clear need.

## Testing and Change Safety

Run `npm test` and `npm run build` after relevant code changes. Add or update focused parser/API tests when source extraction or persistence behavior changes; no dedicated UI test suite is configured.

Do not casually replace the local SQLite database, rewrite saved source extracts/screenshots, change seed semantics, or broaden refresh to arbitrary URLs. Preserve user-edited vendor values unless a deliberate refresh or approved data migration changes them. There is no authentication layer, so do not expose the API beyond a trusted local environment without first addressing access control and deployment security.
