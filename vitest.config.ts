import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./server/__test__/setup.ts"],
    hookTimeout: 30_000, // only the PGlite boot needs this
  },
});
