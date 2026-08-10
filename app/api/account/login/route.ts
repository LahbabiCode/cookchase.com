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

// Simple in-memory brute-force guard (resets on restart — good enough).
const attempts = new Map<string, number[]>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

function isLocked(key: string): boolean {
  const now = Date.now();
  const hits = (attempts.get(key) || []).filter((t) => now - t < WINDOW_MS);
  hits.push(now); // record this attempt (so the first one counts)
  attempts.set(key, hits);
  return hits.length > MAX_ATTEMPTS;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!EMAIL_RE.test(email) || !password) {
      return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    }

    const key = `${clientIp(req)}:${email}`;
    if (isLocked(key)) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a few minutes." },
        { status: 429 }
      );
    }

    const user = getDb()
      .prepare("SELECT id, email, password_hash FROM accounts WHERE email = ?")
      .get(email) as { id: number; email: string; password_hash: string } | undefined;

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
    }

    const token = createAccountSession(user.id, deviceFromRequest(req.headers));
    const res = NextResponse.json({ ok: true, email: user.email });
    res.cookies.set(ACCOUNT_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Sign in failed. Try again." }, { status: 500 });
  }
}
