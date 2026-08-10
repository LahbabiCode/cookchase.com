import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import {
  createAccountSession,
  deviceFromRequest,
  ACCOUNT_SESSION_COOKIE
} from "@/lib/account-auth";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
    const password = String(body.password || "");

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = db.prepare("SELECT id FROM accounts WHERE email = ?").get(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in." },
        { status: 409 }
      );
    }

    const hash = bcrypt.hashSync(password, 10);
    const info = db.prepare("INSERT INTO accounts (email, password_hash) VALUES (?, ?)").run(email, hash);
    const token = createAccountSession(Number(info.lastInsertRowid), deviceFromRequest(req.headers));

    const res = NextResponse.json({ ok: true, email });
    res.cookies.set(ACCOUNT_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Could not create your account. Try again." }, { status: 500 });
  }
}
