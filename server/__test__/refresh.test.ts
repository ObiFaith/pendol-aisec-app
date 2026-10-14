// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { refreshVendorRecord } from "..";
import { AIRLOCK_ID, FULL_PAGE, makeStore, makeVendor, respond } from "../testUtils";

describe("refreshVendorRecord", () => {
  it("429: reports rate limiting and leaves the row untouched", async () => {
    const store = makeStore();
    const before = store.getVendor(AIRLOCK_ID);

    const result = await refreshVendorRecord({
      vendorId: AIRLOCK_ID,
      store,
      fetchPage: respond(429),
    });

    expect(result).toMatchObject({ status: 429 });
    expect("error" in result && result.error).toMatch(/rate-limiting/i);
    expect(store.getVendor(AIRLOCK_ID)).toEqual(before);
  });

  it.each([403, 500, 503])("HTTP %i: returns 502 and leaves the row untouched", async (code) => {
    const store = makeStore();
    const before = store.getVendor(AIRLOCK_ID);

    const result = await refreshVendorRecord({
      vendorId: AIRLOCK_ID,
      store,
      fetchPage: respond(code),
    });

    expect(result).toMatchObject({ status: 502 });
    expect(store.getVendor(AIRLOCK_ID)).toEqual(before);
  });

  it("network failure: returns 502 and leaves the row untouched", async () => {
    const store = makeStore();
    const before = store.getVendor(AIRLOCK_ID);

    const result = await refreshVendorRecord({
      vendorId: AIRLOCK_ID,
      store,
      fetchPage: async () => {
        throw new Error("socket hang up");
      },
    });

    expect(result).toMatchObject({ status: 502, error: "socket hang up" });
    expect(store.getVendor(AIRLOCK_ID)).toEqual(before);
  });

  it.each([
    ["no website link", "<h1>Airlock</h1><p>Some description</p>"],
    [
      "no description",
      `<h1>Airlock</h1><a href="https://acme.example/?utm_source=x">Visit Website</a>`,
    ],
    ["empty page", "<html><body></body></html>"],
  ])("incomplete page (%s): returns 422 and does not overwrite good data", async (_label, html) => {
    const store = makeStore();
    const before = store.getVendor(AIRLOCK_ID);

    const result = await refreshVendorRecord({
      vendorId: AIRLOCK_ID,
      store,
      fetchPage: respond(200, html),
    });

    expect(result).toMatchObject({ status: 422 });
    expect(store.getVendor(AIRLOCK_ID)).toEqual(before);
  });

  it("happy path: overwrites the row and sets refreshedAt", async () => {
    const store = makeStore();
    expect(store.getVendor(AIRLOCK_ID)?.refreshedAt).toBeNull();

    const result = await refreshVendorRecord({
      vendorId: AIRLOCK_ID,
      store,
      fetchPage: respond(200, FULL_PAGE),
    });

    expect(result).toMatchObject({ status: 200 });
    const row = store.getVendor(AIRLOCK_ID)!;
    expect(row.name).toBe("Acme");
    expect(row.website).toBe("https://acme.example/product");
    expect(row.description).toBe("New description from source.");
    expect(row.refreshedAt).not.toBeNull();
  });

  it("only changes the vendor being refreshed", async () => {
    const other = makeVendor({ id: "other-tool", name: "Other" });
    const store = makeStore([makeVendor(), other]);
    const otherBefore = store.getVendor("other-tool");

    await refreshVendorRecord({
      vendorId: AIRLOCK_ID,
      store,
      fetchPage: respond(200, FULL_PAGE),
    });

    expect(store.getVendor("other-tool")).toEqual(otherBefore);
  });

  it("404: unknown vendor never calls the fetcher", async () => {
    const fetchPage = vi.fn(respond(200, FULL_PAGE));

    const result = await refreshVendorRecord({
      vendorId: "does-not-exist",
      store: makeStore(),
      fetchPage,
    });

    expect(result).toMatchObject({ status: 404 });
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it("400: refuses a saved source URL that is not cybersectools.com", async () => {
    const store = makeStore([makeVendor({ sourceUrl: "https://evil.example.com/tools/x" })]);
    const fetchPage = vi.fn(respond(200, FULL_PAGE));

    const result = await refreshVendorRecord({ vendorId: AIRLOCK_ID, store, fetchPage });

    expect(result).toMatchObject({ status: 400 });
    expect(fetchPage).not.toHaveBeenCalled();
  });
});
