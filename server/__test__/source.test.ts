// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCybersecToolsTool } from "../source";
import { AIRLOCK_ID } from "../testUtils";


describe("parseCybersecToolsTool", () => {
  it("extracts name, website and description from a tool page", () => {
    const record = parseCybersecToolsTool(`
      <html>
        <head><meta property="og:description" content="AI governance platform."></head>
        <body>
          <h1>Product Name</h1>
          <a href="/companies/acme">By Acme Security</a>
          <a href="https://acme.example/?utm_source=cybersectools">Visit Website</a>
        </body>
      </html>`);

    expect(record).toEqual({
      name: "Acme Security",
      website: "https://acme.example/",
      description: "AI governance platform.",
    });
  });

  it("falls back to the h1 when there is no company link", () => {
    const record = parseCybersecToolsTool(`
      <html>
        <head><meta name="description" content="Local-first firewall."></head>
        <body><h1>HOL Guard</h1></body>
      </html>`);

    expect(record.name).toBe("HOL Guard");
    expect(record.description).toBe("Local-first firewall.");
  });

  it("prefers the on-page paragraph over the meta description", () => {
    const record = parseCybersecToolsTool(`
      <head><meta property="og:description" content="Long SEO text"></head>
      <body><h1>X</h1><p>Short on-page text.</p></body>`);

    expect(record.description).toBe("Short on-page text.");
  });

  it("keeps other query params but strips utm_source and utm_medium", () => {
    const record = parseCybersecToolsTool(`
      <h1>X</h1><p>Desc</p>
      <a href="https://acme.example/p?ref=1&amp;utm_source=cybersectools.com&amp;utm_medium=tool-detail">Visit Website</a>`);

    expect(record.website).toBe("https://acme.example/p?ref=1");
  });

  it("returns an empty website for non-http or relative links", () => {
    const js = parseCybersecToolsTool(
      `<h1>X</h1><p>Desc</p><a href="javascript:alert(1)">Visit Website</a>`,
    );
    const relative = parseCybersecToolsTool(
      `<h1>X</h1><p>Desc</p><a href="/tools/x">Visit Website</a>`,
    );

    expect(js.website).toBe("");
    expect(relative.website).toBe("");
  });

  it("returns empty fields when the page has nothing usable", () => {
    expect(parseCybersecToolsTool("<html><body></body></html>")).toEqual({
      name: "",
      website: "",
      description: "",
    });
  });

  // Runs against the real page saved by the seed script; skipped until it exists.
  const fixture = resolve(process.cwd(), "fixtures", `tool-${AIRLOCK_ID}.html`);
  it.skipIf(!existsSync(fixture))("parses the saved real detail page", () => {
    const record = parseCybersecToolsTool(readFileSync(fixture, "utf8"));

    expect(record.name).toBe("Airlock Digital");
    expect(record.website).toBe(
      "https://www.airlockdigital.com/agentic-ai-control-governance",
    );
    expect(record.description).toBe(
      "Endpoint platform to discover, govern, and monitor AI agent behavior in real time.",
    );
  });
});