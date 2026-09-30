# AI Security Vendor Register

A local React and TypeScript app for searching, editing, and refreshing AI security vendor records from CybersecTools.

## Run locally

```sh
npm install
npm run seed
npm run dev
```

Open `http://localhost:5173`. The API runs on port 3001 and stores records in `data/vendors.sqlite`. `npm run seed` is safe to repeat; it only inserts missing vendor IDs.

## Data and source

`data/category-page-1.json` and `data/category-page-2.json` preserve the extracted listings from the first two AI Security category pages. CybersecTools returned HTTP 429 to direct HTML downloads during collection, so these files are structured source extracts rather than byte-for-byte HTML snapshots. `data/vendors.json` contains the initial deduplicated company records. Multiple products from one company resolve to one vendor, and the saved source URL points to a representative product detail page.

The company description starts from the listing's concise product summary when a separate company summary is unavailable. Editing changes the local record; **Refresh from source** replaces its name, website, and description with current values from CybersecTools. A failed upstream refresh leaves the saved record unchanged.

## Checks

```sh
npm test
npm run build
```
