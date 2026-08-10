import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

// In-memory per-IP rate limiting (reset on server restart — good enough for
// a lightweight feedback widget). Mirrors the comments endpoint's approach.
const rate = new Map<string, number[]>();
const MAX_PER_HOUR = 10;
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = String(body.slug || "").trim().slice(0, 120);
    const helpful = body.helpful === true || body.helpful === false ? body.helpful : null;

    if (!slug) {
      return NextResponse.json({ error: "Missing tool" }, { status: 400 });
    }
    if (helpful === null) {
      return NextResponse.json({ error: "Choose yes or no" }, { status: 400 });
    }

    // Only accept votes for real tools (and keep the row's slug canonical).
    const tool = getDb()
      .prepare("SELECT slug FROM tools WHERE slug = ?")
      .get(slug) as { slug: string } | undefined;
    if (!tool) {
      return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
    }

    const ip = clientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "You're voting too quickly. Please wait a bit." },
        { status: 429 }
      );
    }

    getDb()
      .prepare("INSERT INTO guide_feedback (tool_slug, helpful) VALUES (?, ?)")
      .run(tool.slug, helpful ? 1 : 0);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
