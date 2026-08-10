import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/queries";
import {
  getAccountByEmail,
  createPasswordResetToken
} from "@/lib/account-auth";
import { sendPasswordResetEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory rate limiter (resets on restart — good enough for this guard).
const requests = new Map<string, number[]>();
const MAX_PER_IP = 5; // per 15 minutes
const WINDOW_MS = 15 * 60 * 1000;

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (requests.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= MAX_PER_IP) return true;
  hits.push(now);
  requests.set(key, hits);
  return false;
}

/**
 * POST /api/account/forgot-password — send a single-use reset link.
 *
 * Anti-enumeration: we always answer 200 with the same message whether or not
 * the email exists, and the expensive DB/email work only happens for real
 * accounts. Rate-limited per IP so the endpoint can't be used to spam.
 */
// One response for every path — identical text whether the account exists,
// SMTP is down, or the server hiccuped (anti-enumeration).
function okResponse() {
  return NextResponse.json({
    ok: true,
    message:
      "If that email has a CookChase account, we've sent a password reset link. Check your inbox (and spam folder) — the link expires in 1 hour."
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase().slice(0, 254);

    if (!EMAIL_RE.test(email)) {
      return okResponse(); // don't reveal anything about bad input either
    }

    const ipKey = `ip:${clientIp(req)}`;
    const emailKey = `email:${email}`;
    if (isRateLimited(ipKey) || isRateLimited(emailKey)) {
      return okResponse(); // silent throttle — same answer either way
    }

    // SMTP disabled? Behave exactly like a successful send so nothing leaks.
    const account = getAccountByEmail(email);
    if (!account) {
      return okResponse();
    }

    const token = createPasswordResetToken(account.id);
    const siteUrl = getSiteUrl();
    const resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(token)}`;

    // Await the send (never throws) so the SMTP handshake finishes before the
    // response is flushed — on serverless hosts the lambda can freeze right
    // after the response and drop the email entirely. The token stays valid
    // for an hour, so a later retry still works.
    const result = await sendPasswordResetEmail({ email, resetUrl });
    if (!result.sent) {
      // Don't leak to the visitor (anti-enumeration) — log for the admin.
      console.error("[forgot-password] reset email not sent:", result.status);
    }

    return okResponse();
  } catch (err) {
    // The error is logged so real faults (e.g. DB down) stay visible to the
    // operator, while the visitor still gets the generic success response.
    console.error("[forgot-password] request failed:", err);
    return okResponse();
  }
}
