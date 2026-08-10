import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { ACCOUNT_SESSION_COOKIE } from "@/lib/account-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  // Invalidate the session server-side so a stolen cookie can't be reused,
  // then clear the cookie in the browser.
  const token = cookies().get(ACCOUNT_SESSION_COOKIE)?.value;
  if (token) {
    try {
      getDb().prepare("DELETE FROM account_sessions WHERE token = ?").run(token);
    } catch {
      /* ignore */
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCOUNT_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return res;
}
