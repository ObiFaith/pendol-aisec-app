import { vi } from "vitest";

process.env.DATABASE_URL = "postgres://blocked-in-tests.invalid/none";
delete process.env.DATABASE_SSL;

// Any attempt to open a real Postgres connection throws immediately.
vi.mock("pg", () => {
  class Pool {
    constructor() {
      throw new Error("Tests must never open a real Postgres connection.");
    }
  }
  return { default: { Pool }, Pool };
});