import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { getCurrentAccountId, ACCOUNT_SESSION_COOKIE } from "@/lib/account-auth";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Sign in required" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const accountId = getCurrentAccountId();
  if (!accountId) return unauth();

  try {
    const body = await req.json();
    const current = String(body.current || "");
    const next = String(body.next || "");

    if (next.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const account = getDb()
      .prepare("SELECT id, password_hash FROM accounts WHERE id = ?")
      .get(accountId) as { id: number; password_hash: string } | undefined;
    if (!account) return unauth();

    if (!bcrypt.compareSync(current, account.password_hash)) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 }
      );
    }

    const hash = bcrypt.hashSync(next, 10);
    getDb().prepare("UPDATE accounts SET password_hash = ? WHERE id = ?").run(hash, accountId);

    // Security hardening: changing the password signs out every other device,
    // keeping the device that made the change signed in.
    const db = getDb();
    const currentToken = cookies().get(ACCOUNT_SESSION_COOKIE)?.value || "";
    db.prepare("DELETE FROM account_sessions WHERE account_id = ? AND token != ?").run(
      accountId,
      currentToken
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not change the password." }, { status: 500 });
  }
}
