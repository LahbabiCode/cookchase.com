import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateResetToken,
  isResetTokenExpired,
  normalizeResetToken,
  RESET_TOKEN_PREFIX,
  RESET_TOKEN_TTL_MS
} from "../lib/reset-token.ts";

test("generated tokens are prefixed, URL-safe and high entropy", () => {
  const t = generateResetToken();
  assert.ok(t.startsWith(RESET_TOKEN_PREFIX));
  assert.match(t, /^[A-Za-z0-9_]+$/); // URL-safe chars only
  // prefix (3) + 32 hex chars = 35
  assert.ok(t.length >= RESET_TOKEN_PREFIX.length + 32);
});

test("tokens are unique across calls", () => {
  const a = generateResetToken();
  const b = generateResetToken();
  assert.notEqual(a, b);
});

test("fresh tokens are not expired", () => {
  const t = generateResetToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
  assert.equal(isResetTokenExpired(expiresAt), false);
});

test("expired tokens are detected", () => {
  const expired = new Date(Date.now() - 1000).toISOString();
  assert.equal(isResetTokenExpired(expired), true);
});

test("unparseable expiry is treated as expired", () => {
  assert.equal(isResetTokenExpired("not-a-date"), true);
  assert.equal(isResetTokenExpired(""), true);
});

test("token TTL is exactly one hour", () => {
  assert.equal(RESET_TOKEN_TTL_MS, 1000 * 60 * 60);
});

test("normalizeResetToken accepts a well-formed token", () => {
  const t = generateResetToken();
  assert.equal(normalizeResetToken(t), t);
  assert.equal(normalizeResetToken(`  ${t}  `), t); // trims whitespace
});

test("normalizeResetToken rejects malformed input", () => {
  assert.equal(normalizeResetToken(null), null);
  assert.equal(normalizeResetToken(undefined), null);
  assert.equal(normalizeResetToken(""), null);
  assert.equal(normalizeResetToken("plain-token"), null); // wrong prefix
  assert.equal(normalizeResetToken(`${RESET_TOKEN_PREFIX}short`), null); // too short
  assert.equal(normalizeResetToken("X".repeat(200)), null); // oversized garbage
});

test("normalizeResetToken caps input length before validating", () => {
  // A huge prefix-valid string gets sliced to 64 chars; if the slice no
  // longer has a valid body it's rejected rather than crashing.
  const huge = `${RESET_TOKEN_PREFIX}${"a".repeat(500)}`;
  const out = normalizeResetToken(huge);
  assert.ok(out === null || out.length <= 64);
});
