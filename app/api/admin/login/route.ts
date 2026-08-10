import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Simple in-memory brute-force protection.
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

function isLocked(username: string): boolean {
  const entry = attempts.get(username);
  if (!entry) return false;
  if (Date.now() > entry.lockedUntil) {
    attempts.delete(username);
    return false;
  }
  return true;
}

function recordFailure(username: string) {
  const entry = attempts.get(username) || { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCK_MS;
  }
  attempts.set(username, entry);
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    if (isLocked(String(username))) {
      return NextResponse.json(
        { error: "Too many attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    const user = getDb()
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(String(username)) as
      | { id: number; username: string; password_hash: string }
      | undefined;

    if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
      recordFailure(String(username));
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    attempts.delete(String(username));
    const token = createSession(user.id);
    const res = NextResponse.json({ ok: true, username: user.username });
    res.cookies.set("cookchase_admin", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
