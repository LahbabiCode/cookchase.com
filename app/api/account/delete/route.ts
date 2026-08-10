import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { getCurrentAccountId, ACCOUNT_SESSION_COOKIE } from "@/lib/account-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const accountId = getCurrentAccountId();
  if (!accountId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const password = String(body.password || "");

    const account = getDb()
      .prepare("SELECT id, password_hash FROM accounts WHERE id = ?")
      .get(accountId) as { id: number; password_hash: string } | undefined;
    if (!account) return unauth();

    if (!bcrypt.compareSync(password, account.password_hash)) {
      return NextResponse.json(
        { error: "Password is incorrect — we couldn't verify it's you." },
        { status: 400 }
      );
    }

    const db = getDb();
    db.transaction(() => {
      db.prepare("DELETE FROM account_favorites WHERE account_id = ?").run(accountId);
      db.prepare("DELETE FROM result_history WHERE account_id = ?").run(accountId);
      db.prepare("DELETE FROM account_sessions WHERE account_id = ?").run(accountId);
      db.prepare("DELETE FROM accounts WHERE id = ?").run(accountId);
    })();

    // Clear the session cookie — the account (and its sessions) no longer exist.
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ACCOUNT_SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Could not delete the account." }, { status: 500 });
  }
}

function unauth() {
  return NextResponse.json({ error: "Sign in required" }, { status: 401 });
}
