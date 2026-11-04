import { test } from "node:test";
import assert from "node:assert/strict";
import { providerError } from "../server/provider-error.mjs";

test("billing failures explain the required action rather than suggesting retries", () => {
  for (const [code, expected] of [
    ["credit_balance_exhausted", /Add credits/],
    ["organization_spend_limit_exceeded", /organization.*spending limit/],
    ["project_spend_limit_exceeded", /project.*spending limit/],
    ["organization_usage_limit_exceeded", /higher limit/],
    ["insufficient_quota", /credits and limits/],
    ["future_quota_code", /credits and limits/],
  ]) {
    const result = providerError(429, { error: { code, type: "insufficient_quota" } });
    assert.equal(result.status, 503);
    assert.match(result.error, expected);
  }
});

test("temporary throttling and provider outages have distinct guidance", () => {
  assert.equal(providerError(429, {}).status, 429);
  assert.match(providerError(429, {}).error, /Wait a moment/);
  assert.match(providerError(503, {}).error, /temporarily unavailable/);
});

test("authentication, access, and model errors explain configuration fixes", () => {
  assert.match(providerError(401, {}).error, /Replace OPENAI_API_KEY/);
  assert.match(providerError(403, {}).error, /permissions/);
  assert.match(providerError(404, { error: { code: "model_not_found" } }).error, /OPENAI_MODEL/);
});

test("untrusted provider text and malformed errors are never exposed", () => {
  for (const body of [null, "bad gateway", {}, { error: null }, { error: { code: "__proto__", message: "SECRET_KEY_AND_PROMPT" } }]) {
    const result = providerError(400, body);
    assert.equal(result.status, 502);
    assert.equal(typeof result.error, "string");
    assert.doesNotMatch(result.error, /SECRET_KEY_AND_PROMPT/);
  }
});
