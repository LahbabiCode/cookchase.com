import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getCurrentAccountId,
  listAccountSessions,
  touchAccountSession,
  ACCOUNT_SESSION_COOKIE
} from "@/lib/account-auth";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Sign in required" }, { status: 401 });
}

/**
 * GET — the signed-in user's active sessions (devices), newest first. The
 * current device is marked and its last_seen is refreshed so the list
 * reflects this visit. Session tokens are never exposed — only public ids.
 */
export async function GET() {
  const accountId = getCurrentAccountId();
  if (!accountId) return unauth();
  const token = cookies().get(ACCOUNT_SESSION_COOKIE)?.value;
  if (token) {
    try {
      touchAccountSession(token);
    } catch {
      /* ignore */
    }
  }
  return NextResponse.json({ sessions: listAccountSessions(accountId) });
}
