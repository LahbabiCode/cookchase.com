import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAccountId } from "@/lib/account-auth";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Sign in required" }, { status: 401 });
}

export async function GET() {
  const accountId = getCurrentAccountId();
  if (!accountId) return unauth();
  const rows = getDb()
    .prepare(
      "SELECT slug FROM account_favorites WHERE account_id = ? ORDER BY created_at DESC"
    )
    .all(accountId) as { slug: string }[];
  return NextResponse.json({ slugs: rows.map((r) => r.slug) });
}

// PUT with { slugs: string[] } replaces the account's entire favorites list.
// The client sends its complete list (after merging device-local favorites),
// which keeps the sync model simple and idempotent.
export async function PUT(req: NextRequest) {
  const accountId = getCurrentAccountId();
  if (!accountId) return unauth();
  try {
    const body = await req.json();
    const slugs = Array.isArray(body.slugs)
      ? body.slugs.map(String).slice(0, 200)
      : [];
    const db = getDb();
    const tx = db.transaction(() => {
      db.prepare("DELETE FROM account_favorites WHERE account_id = ?").run(accountId);
      const insert = db.prepare(
        "INSERT OR IGNORE INTO account_favorites (account_id, slug) VALUES (?, ?)"
      );
      for (const slug of slugs) {
        if (slug.trim()) insert.run(accountId, slug.trim());
      }
    });
    tx();
    return NextResponse.json({ ok: true, count: slugs.length });
  } catch {
    return NextResponse.json({ error: "Could not save favorites" }, { status: 500 });
  }
}
