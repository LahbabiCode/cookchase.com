import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { getDb } from "./db";

const SESSION_COOKIE = "cookchase_admin";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function createSession(userId: number): string {
  const db = getDb();
  // Prune this user's expired sessions to keep the table small.
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at < ?").run(
    userId,
    new Date().toISOString()
  );
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(
    token,
    userId,
    expiresAt
  );
  return token;
}

export function destroySession(token: string) {
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function getCurrentUserId(): number | null {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      "SELECT user_id, expires_at FROM sessions WHERE token = ?"
    )
    .get(token) as { user_id: number; expires_at: string } | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    destroySession(token);
    return null;
  }
  return row.user_id;
}

export function isAdminAuthed(): boolean {
  return getCurrentUserId() !== null;
}

