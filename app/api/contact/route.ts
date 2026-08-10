import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSetting, getSiteUrl } from "@/lib/queries";
import { sendAdminEmail, notifyEnabled } from "@/lib/mail";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory per-IP rate limiting (reset on server restart — good enough).
const rate = new Map<string, number[]>();
const MAX_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rate.get(ip) || []).filter((t) => now - t < HOUR_MS);
  hits.push(now); // record this request, pruning older ones
  rate.set(ip, hits);
  return hits.length > MAX_PER_HOUR;
}

/**
 * Contact form submission. Stores the message (so it is never lost even if
 * SMTP is down) and — when the "contact messages" notification is enabled —
 * emails the admin a summary with a link to the inbox. Protected against
 * spam with a honeypot field and per-IP rate limiting.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().slice(0, 200);
    const subject = String(body.subject || "").trim().slice(0, 200);
    const message = String(body.message || "").trim().slice(0, 5000);
    const website = String(body.website || "").trim(); // honeypot field

    // Honeypot: bots fill the hidden field → pretend success, store nothing.
    if (website) {
      return NextResponse.json({ ok: true });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const ip = clientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many messages. Please try again in a bit." },
        { status: 429 }
      );
    }

    // Always store — the admin inbox is the source of truth.
    getDb()
      .prepare(
        "INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)"
      )
      .run(name, email, subject, message);

    // Email the admin only when the notification type is enabled. The message
    // is already stored, so a mail failure must never fail the request — we
    // await with an 8s cap so the email reliably sends even on serverless.
    if (notifyEnabled("notify_contact")) {
      const siteUrl = getSiteUrl();
      const siteName = getSetting("site_name") || "CookChase";
      const notification = sendAdminEmail({
        subject: `New contact message from ${name}`,
        intro: `${name} sent a message through the ${siteName} contact page.`,
        rows: [
          { label: "From", value: name },
          { label: "Email", value: email },
          ...(subject ? [{ label: "Subject", value: subject }] : [])
        ],
        preview: message,
        actionHref: `${siteUrl}/admin/inbox`,
        actionLabel: "Open message inbox"
      });
      const timeout = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 8000)
      );
      const result = await Promise.race([notification, timeout]);
      if (result && !result.sent && !result.status.startsWith("SMTP disabled")) {
        console.warn(`[mail] contact notification skipped: ${result.status}`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
