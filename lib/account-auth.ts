import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { getDb } from "./db";
import { parseUserAgent } from "./device";
import {
  generateResetToken,
  isResetTokenExpired,
  RESET_TOKEN_TTL_MS
} from "./reset-token";
import {
  DEFAULT_SETTINGS,
  sanitizeSettings,
  settingsDifferFromDefaults,
  type UserSettings
} from "./settings-utils";

const SESSION_COOKIE = "cookchase_account";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 90; // 90 days

export interface Account {
  id: number;
  email: string;
  created_at: string;
}

/** Device metadata captured at sign-in for the "your devices" list. */
export interface SessionDevice {
  userAgent: string;
  ip: string;
}

/** Pull device info from a request's headers (IP honors proxy headers). */
export function deviceFromRequest(headers: Headers): SessionDevice {
  const fwd = headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : headers.get("x-real-ip") || "";
  return {
    userAgent: headers.get("user-agent") || "",
    ip: ip.slice(0, 64)
  };
}

export function createAccountSession(accountId: number, device?: SessionDevice): string {
  const db = getDb();
  db.prepare("DELETE FROM account_sessions WHERE account_id = ? AND expires_at < ?").run(
    accountId,
    new Date().toISOString()
  );
  const token = randomUUID();
  const sessionId = `s_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare(
    `INSERT INTO account_sessions (token, session_id, account_id, expires_at, user_agent, ip, last_seen)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    token,
    sessionId,
    accountId,
    expiresAt,
    (device?.userAgent || "").slice(0, 400),
    device?.ip || "",
    now
  );
  return token;
}

export function destroyAccountSession(token: string) {
  getDb().prepare("DELETE FROM account_sessions WHERE token = ?").run(token);
}

/**
 * All active sessions for an account, newest activity first, with a human
 * device label. The raw session token is never returned — only the public
 * session_id used for remote revocation.
 */
export interface AccountSessionRow {
  sessionId: string;
  current: boolean;
  deviceLabel: string;
  deviceKind: "mobile" | "tablet" | "desktop";
  ip: string;
  createdAt: string;
  lastSeen: string;
  expiresAt: string;
}

export function listAccountSessions(accountId: number): AccountSessionRow[] {
  const currentToken = cookies().get(SESSION_COOKIE)?.value || "";
  const rows = getDb()
    .prepare(
      `SELECT session_id, token, user_agent, ip, created_at, last_seen, expires_at
       FROM account_sessions WHERE account_id = ?
       ORDER BY last_seen DESC, created_at DESC`
    )
    .all(accountId) as {
    session_id: string;
    token: string;
    user_agent: string;
    ip: string;
    created_at: string;
    last_seen: string;
    expires_at: string;
  }[];
  return rows.map((r) => {
    const dev = parseUserAgent(r.user_agent);
    return {
      sessionId: r.session_id,
      current: r.token === currentToken,
      deviceLabel: dev.label,
      deviceKind: dev.kind,
      ip: r.ip,
      createdAt: r.created_at,
      lastSeen: r.last_seen,
      expiresAt: r.expires_at
    };
  });
}

/** Touch last_seen so the sessions list reflects this device's activity. */
export function touchAccountSession(token: string) {
  getDb()
    .prepare("UPDATE account_sessions SET last_seen = ? WHERE token = ?")
    .run(new Date().toISOString(), token);
}

/**
 * Revoke a session by its public id. Returns false when the session does not
 * belong to this account. The current device can't revoke itself here (sign
 * out instead).
 */
export function revokeAccountSession(accountId: number, sessionId: string): boolean {
  const currentToken = cookies().get(SESSION_COOKIE)?.value || "";
  const row = getDb()
    .prepare("SELECT token FROM account_sessions WHERE session_id = ? AND account_id = ?")
    .get(sessionId, accountId) as { token: string } | undefined;
  if (!row || row.token === currentToken) return false;
  getDb()
    .prepare("DELETE FROM account_sessions WHERE session_id = ? AND account_id = ?")
    .run(sessionId, accountId);
  return true;
}

export function getCurrentAccountId(): number | null {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare("SELECT account_id, expires_at FROM account_sessions WHERE token = ?")
    .get(token) as { account_id: number; expires_at: string } | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    destroyAccountSession(token);
    return null;
  }
  return row.account_id;
}

export function getCurrentAccount(): Account | null {
  const id = getCurrentAccountId();
  if (!id) return null;
  const row = getDb()
    .prepare("SELECT id, email, created_at FROM accounts WHERE id = ?")
    .get(id) as Account | undefined;
  return row ?? null;
}

export const ACCOUNT_SESSION_COOKIE = SESSION_COOKIE;

// ---- User settings (units / language / easy mode) -----------------------------

/**
 * The account's synced preferences. A missing row is the public default, so
 * the table only needs a row once the user actually changes something.
 */
export function getAccountSettings(accountId: number): UserSettings {
  const row = getDb()
    .prepare(
      "SELECT units, language, easy_mode, compact_mode, easy_contrast FROM account_settings WHERE account_id = ?"
    )
    .get(accountId) as
    | {
        units: string;
        language: string;
        easy_mode: number;
        compact_mode: number;
        easy_contrast: number;
      }
    | undefined;
  if (!row) return { ...DEFAULT_SETTINGS };
  return sanitizeSettings({
    units: row.units as UserSettings["units"],
    language: row.language as UserSettings["language"],
    easyMode: row.easy_mode === 1,
    compactMode: row.compact_mode === 1,
    easyContrast: row.easy_contrast === 1
  });
}

/**
 * Persist a settings patch (upsert). Invalid values are dropped by
 * sanitizeSettings, never stored. When the result equals the public defaults
 * the row is deleted instead — getAccountSettings returns the same values for
 * a missing row, so this keeps the table sparse without changing behavior.
 * Returns the saved settings.
 */
export function updateAccountSettings(
  accountId: number,
  patch: Partial<UserSettings>
): UserSettings {
  const current = getAccountSettings(accountId);
  const next = sanitizeSettings(patch, current);
  if (settingsDifferFromDefaults(next)) {
    getDb()
      .prepare(
        `INSERT INTO account_settings (account_id, units, language, easy_mode, compact_mode, easy_contrast, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(account_id) DO UPDATE SET
           units = excluded.units,
           language = excluded.language,
           easy_mode = excluded.easy_mode,
           compact_mode = excluded.compact_mode,
           easy_contrast = excluded.easy_contrast,
           updated_at = datetime('now')`
      )
      .run(
        accountId,
        next.units,
        next.language,
        next.easyMode ? 1 : 0,
        next.compactMode ? 1 : 0,
        next.easyContrast ? 1 : 0
      );
  } else {
    getDb()
      .prepare("DELETE FROM account_settings WHERE account_id = ?")
      .run(accountId);
  }
  return next;
}

// ---- Password reset ----------------------------------------------------------

/** Look up an account by email (returns the row shape used by auth routes). */
export interface AccountWithPassword {
  id: number;
  email: string;
  password_hash: string;
}

export function getAccountByEmail(email: string): AccountWithPassword | null {
  const row = getDb()
    .prepare(
      "SELECT id, email, password_hash FROM accounts WHERE email = ?"
    )
    .get(email.toLowerCase().trim()) as AccountWithPassword | undefined;
  return row ?? null;
}

/**
 * Create a single-use reset token for an account. Any previous tokens for the
 * same account are invalidated so only the newest email link works. Returns
 * the raw token (the caller emails it as part of the reset URL).
 */
export function createPasswordResetToken(accountId: number): string {
  const db = getDb();
  db.prepare("DELETE FROM password_resets WHERE account_id = ?").run(accountId);
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
  db.prepare(
    "INSERT INTO password_resets (account_id, token, expires_at) VALUES (?, ?, ?)"
  ).run(accountId, token, expiresAt);
  return token;
}

/**
 * Validate + consume a reset token. Returns the account id on success, or null
 * when the token is missing, expired or already used. Consumption is atomic:
 * marking `used = 1` inside the same transaction as the read means a captured
 * link can never be replayed.
 */
export function consumePasswordResetToken(token: string): number | null {
  const db = getDb();
  const row = db
    .prepare("SELECT id, account_id, expires_at, used FROM password_resets WHERE token = ?")
    .get(token) as
    | { id: number; account_id: number; expires_at: string; used: number }
    | undefined;
  if (!row) return null;
  if (row.used === 1) return null;
  if (isResetTokenExpired(row.expires_at)) return null;
  db.prepare("UPDATE password_resets SET used = 1 WHERE id = ?").run(row.id);
  return row.account_id;
}

/** Set a new password hash for an account and sign out every device. */
export function resetAccountPassword(accountId: number, passwordHash: string) {
  const db = getDb();
  db.transaction(() => {
    db.prepare("UPDATE accounts SET password_hash = ? WHERE id = ?").run(
      passwordHash,
      accountId
    );
    db.prepare("DELETE FROM account_sessions WHERE account_id = ?").run(accountId);
    // Sweep used/expired tokens so the table never grows unbounded.
    db.prepare(
      "DELETE FROM password_resets WHERE account_id = ? OR used = 1 OR expires_at < ?"
    ).run(accountId, new Date().toISOString());
  })();
}
