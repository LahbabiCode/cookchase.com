import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// In-memory per-IP rate limiting (reset on server restart — good enough).
const rate = new Map<string, number[]>();
const MAX_PER_HOUR = 120;
const HOUR_MS = 60 * 60 * 1000;
// Prune the map when it gets large so long-running servers don't accumulate
// one entry per unique visitor forever.
const PRUNE_AT = 5000;

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (rate.size >= PRUNE_AT) {
    for (const [key, stamps] of Array.from(rate.entries())) {
      const live = stamps.filter((t) => now - t < HOUR_MS);
      if (live.length === 0) rate.delete(key);
      else rate.set(key, live);
    }
  }
  const hits = (rate.get(ip) || []).filter((t) => now - t < HOUR_MS);
  hits.push(now); // record this request, pruning older ones
  rate.set(ip, hits);
  return hits.length > MAX_PER_HOUR;
}

/**
 * Like / unlike a comment. The frontend enforces one vote per comment per
 * browser via localStorage; this route just applies the delta safely:
 *  - the comment must exist,
 *  - "unlike" can never drive the count below 0,
 *  - a single IP can't hammer the counter (abuse backstop).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "like");
    if (action !== "like" && action !== "unlike") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const ip = clientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many likes. Please slow down." },
        { status: 429 }
      );
    }

    const db = getDb();
    // Only approved comments are visible publicly — liking a pending comment
    // (still invisible) would be confusing, so reject it.
    const exists = db
      .prepare("SELECT id FROM comments WHERE id = ? AND approved = 1")
      .get(id);
    if (!exists) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (action === "like") {
      db.prepare("UPDATE comments SET likes = likes + 1 WHERE id = ?").run(id);
    } else {
      db.prepare(
        "UPDATE comments SET likes = MAX(likes - 1, 0) WHERE id = ?"
      ).run(id);
    }

    const row = db
      .prepare("SELECT likes FROM comments WHERE id = ?")
      .get(id) as { likes: number };
    return NextResponse.json({ ok: true, likes: row.likes });
  } catch {
    return NextResponse.json({ error: "Failed to update like" }, { status: 500 });
  }
}
