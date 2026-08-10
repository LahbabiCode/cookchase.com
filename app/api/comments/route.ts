import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  getApprovedComments,
  getCommentDepth,
  checkAlertForSlug,
  type AlertPageType
} from "@/lib/queries";
import { sendNewCommentNotification, sendSpikeAlertEmail, notifyEnabled } from "@/lib/mail";
import { MAX_COMMENT_DEPTH } from "@/lib/constants";

export const dynamic = "force-dynamic";

// In-memory per-IP rate limiting (reset on server restart — good enough).
const rate = new Map<string, number[]>();
const MAX_PER_HOUR = 3;
const HOUR_MS = 60 * 60 * 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "tool";
  const slug = req.nextUrl.searchParams.get("slug") || "";
  if (!slug) return NextResponse.json([], { status: 200 });
  return NextResponse.json(getApprovedComments(type, slug));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawType = String(body.pageType || "tool");
    // page = homepage or /tools listing; article = blog post; anything else = a tool page.
    const pageType = rawType === "article" || rawType === "page" ? rawType : "tool";
    const pageSlug = String(body.pageSlug || "").trim();
    const name = String(body.name || "").trim().slice(0, 60);
    const email = String(body.email || "").trim().slice(0, 120);
    const message = String(body.message || "").trim().slice(0, 2000);
    const website = String(body.website || "").trim(); // honeypot field
    const parentId = Number(body.parentId) || 0;

    if (!pageSlug) {
      return NextResponse.json({ error: "Missing page" }, { status: 400 });
    }

    // Replies must reference a real, approved comment on the SAME page —
    // otherwise they would hang orphaned in the tree or surface on a page
    // where their parent is never fetched.
    let parentName = "";
    if (parentId) {
      const parent = getDb()
        .prepare(
          "SELECT name FROM comments WHERE id = ? AND approved = 1 AND page_type = ? AND page_slug = ?"
        )
        .get(parentId, pageType, pageSlug) as { name: string } | undefined;
      if (!parent) {
        return NextResponse.json({ error: "Invalid parent" }, { status: 400 });
      }
      parentName = parent.name;

      // Depth limit: a reply whose parent is already at depth 3 would create a
      // 4th level the UI cannot show — reject it up front.
      if (getCommentDepth(parentId) >= MAX_COMMENT_DEPTH) {
        return NextResponse.json(
          { error: "Replies are limited to three levels deep." },
          { status: 400 }
        );
      }
    }

    // Honeypot: bots fill the hidden website field → pretend success, store nothing.
    if (website) {
      return NextResponse.json({ ok: true });
    }

    if (name.length < 2 || message.length < 2) {
      return NextResponse.json(
        { error: "Please enter your name and a comment." },
        { status: 400 }
      );
    }

    // Optional email only enables reply notifications; validate it when given.
    if (email && !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const ip = clientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "You're commenting too quickly. Please wait a bit." },
        { status: 429 }
      );
    }

    const info = getDb()
      .prepare(
        "INSERT INTO comments (page_type, page_slug, name, email, message, approved, parent_id, is_admin) VALUES (?, ?, ?, ?, ?, 0, ?, 0)"
      )
      .run(pageType, pageSlug, name, email, message, parentId);

    // A spike in comments on a tool or article page triggers an admin alert.
    // If that comment CREATED a new spike alert, email the admin about it
    // (gate on the notify_spike_alert setting). Fire-and-forget — a mail
    // failure must never fail the comment submission.
    try {
      if (pageType === "tool" || pageType === "article") {
        const created = checkAlertForSlug(pageType as AlertPageType, pageSlug);
        if (created.length > 0 && notifyEnabled("notify_spike_alert")) {
          for (const alert of created) {
            void sendSpikeAlertEmail(alert).then((r) => {
              if (!r.sent && !r.status.startsWith("SMTP disabled")) {
                console.warn(`[mail] spike-alert notification skipped: ${r.status}`);
              }
            });
          }
        }
      }
    } catch {
      /* alert check must never fail the comment submission */
    }

    // Send the admin email notification (replies are flagged as such). It must
    // never fail the comment submission — misconfiguration is reported, not
    // thrown. We await it with an 8s cap so the email is reliably sent even on
    // serverless (Vercel), while the comment response still returns promptly.
    const notification = sendNewCommentNotification({
      name,
      message,
      pageType,
      pageSlug,
      isReply: Boolean(parentId),
      parentName
    });
    const timeout = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 8000)
    );
    const result = await Promise.race([notification, timeout]);
    if (result && !result.sent) {
      if (!result.status.startsWith("SMTP disabled")) {
        console.warn(`[mail] new-comment notification skipped: ${result.status}`);
      }
    }

    return NextResponse.json({ ok: true, id: info.lastInsertRowid });
  } catch {
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
