import test from "node:test";
import assert from "node:assert/strict";
import { formatRefreshFailure } from "./index.js";

test("refresh returns a friendly rate-limit message when CybersecTools responds 429", () => {
  assert.equal(
    formatRefreshFailure(429),
    "CybersecTools is rate-limiting requests right now. Please wait a moment and try again.",
  );
  assert.equal(
    formatRefreshFailure(403),
    "CybersecTools is blocking requests from this environment. Please try again later.",
  );
});
