import test from "node:test";
import assert from "node:assert/strict";
import { parseCybersecToolsTool } from "./source.js";

test("extracts a vendor profile, website, and summary from a tool page", () => {
  const record = parseCybersecToolsTool(`
    <html>
      <head><meta property="og:description" content="AI governance platform."></head>
      <body>
        <h1>Product Name</h1>
        <a href="/companies/acme">By Acme Security</a>
        <a href="https://acme.example/?utm_source=cybersectools">Visit Website</a>
      </body>
    </html>
  `);

  assert.deepEqual(record, {
    name: "Acme Security",
    website: "https://acme.example/?utm_source=cybersectools",
    description: "AI governance platform.",
    companyProfileUrl: "/companies/acme",
  });
});

test("falls back to the listing name when no company link exists", () => {
  const record = parseCybersecToolsTool(`
    <html>
      <head><meta name="description" content="Local-first firewall."></head>
      <body><h1>HOL Guard</h1></body>
    </html>
  `);

  assert.equal(record.name, "HOL Guard");
  assert.equal(record.description, "Local-first firewall.");
  assert.equal(record.companyProfileUrl, null);
});
