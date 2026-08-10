import { randomUUID } from "crypto";

// Pure password-reset helpers. No DB imports, so the node test runner can load
// this module directly (the DB-backed create/consume live in account-auth.ts).

export const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

export const RESET_TOKEN_PREFIX = "pr_";

/** URL-safe, high-entropy reset token (crypto-random 128 bits). */
export function generateResetToken(): string {
  return `${RESET_TOKEN_PREFIX}${randomUUID().replace(/-/g, "")}`;
}

/** True when the stored expiry has passed (or is unparseable). */
export function isResetTokenExpired(expiresAt: string, now = Date.now()): boolean {
  const t = new Date(expiresAt).getTime();
  if (isNaN(t)) return true;
  return t < now;
}

/**
 * Normalize + validate a token from the reset page. Returns the token when it
 * looks structurally valid (keeps the DB lookup cheap), else null.
 */
export function normalizeResetToken(raw: string | null | undefined): string | null {
  const token = String(raw || "").trim().slice(0, 64);
  if (!token.startsWith(RESET_TOKEN_PREFIX)) return null;
  if (token.length < RESET_TOKEN_PREFIX.length + 24) return null;
  return token;
}
