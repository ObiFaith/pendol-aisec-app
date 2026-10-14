// @vitest-environment node
import { createApp, type FetchPage } from "..";
import { afterEach, describe, expect, it } from "vitest";
import {
  AIRLOCK_ID,
  FULL_PAGE,
  makeStore,
  makeVendor,
  respond,
  startServer,
} from "../testUtils";

let running: Awaited<ReturnType<typeof startServer>> | undefined;
afterEach(async () => {
  await running?.close();
  running = undefined;
});

async function setup({
  vendors,
  fetchPage = respond(500), // an unexpected refresh fails loudly
}: { vendors?: Parameters<typeof makeStore>[0]; fetchPage?: FetchPage } = {}) {
  const store = makeStore(vendors);
  running = await startServer(createApp({ store, fetchPage }));
  return { store, url: running.url };
}

const putJson = (url: string, body: unknown) =>
  fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("GET /api/vendors", () => {
  const vendors = [
    makeVendor({ id: "acme", name: "Acme", description: "Runtime firewall" }),
    makeVendor({ id: "beta", name: "Beta", description: "LLM guardrails" }),
  ];

  it("lists vendors sorted by name", async () => {
    const { url } = await setup({ vendors });
    const body = await (await fetch(`${url}/api/vendors`)).json();
    expect(body.map((v: { id: string }) => v.id)).toEqual(["acme", "beta"]);
  });

  it("searches name and description, case-insensitively", async () => {
    const { url } = await setup({ vendors });
    const byName = await (await fetch(`${url}/api/vendors?q=ACME`)).json();
    const byDescription = await (
      await fetch(`${url}/api/vendors?q=guardrails`)
    ).json();
    const none = await (await fetch(`${url}/api/vendors?q=zzz`)).json();

    expect(byName.map((v: { id: string }) => v.id)).toEqual(["acme"]);
    expect(byDescription.map((v: { id: string }) => v.id)).toEqual(["beta"]);
    expect(none).toEqual([]);
  });
});

describe("GET /api/vendors/:id", () => {
  it("returns the vendor", async () => {
    const { url } = await setup();
    const res = await fetch(`${url}/api/vendors/${AIRLOCK_ID}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      id: AIRLOCK_ID,
      name: "Old name",
    });
  });

  it("404s for an unknown id", async () => {
    const { url } = await setup();
    expect((await fetch(`${url}/api/vendors/nope`)).status).toBe(404);
  });
});

describe("PUT /api/vendors/:id", () => {
  it("saves edits, trims values, and does not set refreshedAt", async () => {
    const { url, store } = await setup();
    const res = await putJson(`${url}/api/vendors/${AIRLOCK_ID}`, {
      name: "  Edited  ",
      website: "https://edited.example/",
      description: "Edited description",
    });

    expect(res.status).toBe(200);
    expect(store.getVendor(AIRLOCK_ID)).toMatchObject({
      name: "Edited",
      website: "https://edited.example/",
      description: "Edited description",
      refreshedAt: null,
    });
  });

  it.each([
    ["empty name", { name: "  ", website: "", description: "d" }],
    [
      "non-http website",
      { name: "N", website: "javascript:alert(1)", description: "d" },
    ],
  ])("400 on %s and leaves the row untouched", async (_label, body) => {
    const { url, store } = await setup();
    const before = store.getVendor(AIRLOCK_ID);

    const res = await putJson(`${url}/api/vendors/${AIRLOCK_ID}`, body);

    expect(res.status).toBe(400);
    expect(store.getVendor(AIRLOCK_ID)).toEqual(before);
  });

  it("404s for an unknown id", async () => {
    const { url } = await setup();
    const res = await putJson(`${url}/api/vendors/nope`, {
      name: "N",
      website: "",
      description: "",
    });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/vendors/:id/refresh", () => {
  it("200: updates the vendor from the source page", async () => {
    const { url, store } = await setup({ fetchPage: respond(200, FULL_PAGE) });
    const res = await fetch(`${url}/api/vendors/${AIRLOCK_ID}/refresh`, {
      method: "POST",
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ name: "Acme" });
    expect(store.getVendor(AIRLOCK_ID)?.refreshedAt).not.toBeNull();
  });

  it("429: returns a JSON error and keeps the stored data", async () => {
    const { url, store } = await setup({ fetchPage: respond(429) });
    const before = store.getVendor(AIRLOCK_ID);

    const res = await fetch(`${url}/api/vendors/${AIRLOCK_ID}/refresh`, {
      method: "POST",
    });

    expect(res.status).toBe(429);
    expect((await res.json()).error).toMatch(/rate-limiting/i);
    expect(store.getVendor(AIRLOCK_ID)).toEqual(before);
  });

  it("422: incomplete page keeps the stored data", async () => {
    const { url, store } = await setup({
      fetchPage: respond(200, "<h1>Only a title</h1>"),
    });
    const before = store.getVendor(AIRLOCK_ID);

    const res = await fetch(`${url}/api/vendors/${AIRLOCK_ID}/refresh`, {
      method: "POST",
    });

    expect(res.status).toBe(422);
    expect(store.getVendor(AIRLOCK_ID)).toEqual(before);
  });

  it("404s for an unknown id", async () => {
    const { url } = await setup();
    expect(
      (await fetch(`${url}/api/vendors/nope/refresh`, { method: "POST" }))
        .status,
    ).toBe(404);
  });
});
