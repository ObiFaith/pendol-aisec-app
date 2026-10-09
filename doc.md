# CybersecTools AI Security data collection

## Outcome

Collected the rendered category listings for pages 1 and 2 on 2026-10-09. The snapshots contain 24 tool listings per page (48 total), including each listing's name, description, and CybersecTools profile URL:

- [Page 1 snapshot](./source/ai-security-page-1.snapshot.txt)
- [Page 2 snapshot](./source/ai-security-page-2.snapshot.txt)
- [Parsed category listings](./source/category-tools.json)

The category cards describe individual tools, not necessarily the company that makes them. I therefore kept one record per listed tool rather than silently merging distinct tools into guessed company records.

## Fetch and extraction process

1. Requested `https://cybersectools.com/categories/ai-security` directly using the web fetcher and `curl` with a browser user agent. Both were blocked with HTTP 429 and a Vercel Security Checkpoint response (`x-vercel-mitigated: challenge`). The `www` host and `?page=2` direct request were also blocked.
2. Opened the category in the integrated browser, which rendered the actual listing despite the direct-request block. The page's pagination linked to `?page=2`; I opened that page and saved both rendered accessibility snapshots above. The first snapshot also shows the source's pagination and page-two URL.
3. Parsed the 48 card names, short descriptions, and profile URLs from those snapshots into `category-tools.json`.
4. Opened tool profile pages to inspect how the source exposes vendor information. On each accessible detail page, I read the company from its “By …” link and the website from the “Website” quick fact (rather than keeping CybersecTools tracking parameters from the “Visit Website” link). A captured example is [WhiteFin's detail snapshot](./source/whitefin-detail.snapshot.txt).

## Limits and assumptions

- Profile-page requests began returning security checkpoints during the sequential enrichment attempt. Company and website fields could be confirmed for only 22 of the 48 listed tools; those records are in [the partial profile enrichment](./source/company-profile-enrichment.partial.json). The remaining 26 were not filled with guesses.
- Some companies have multiple tools on these pages. The corresponding profile-enrichment entries remain separate, and the description in each is the category's tool-level description, not an independently verified company-wide description.
- The category listings themselves were accessible, so this is a useful partial dataset rather than a sample dataset. To complete a company-level import, retry the missing profile pages when access permits, then decide whether multiple tools from the same company should be merged and how to select a company-level description.
- The 429 checkpoint HTML was not kept as a source page; it contained only the access challenge, not listing data. The saved snapshots are the rendered source content used to create the dataset.
