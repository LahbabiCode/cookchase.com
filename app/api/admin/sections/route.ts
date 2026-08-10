import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSiteUrl } from "@/lib/queries";
import { isAdminAuthed } from "@/lib/auth";
import { sendAdminEmail, notifyEnabled } from "@/lib/mail";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  if (!isAdminAuthed()) return unauth();
  const rows = getDb().prepare("SELECT * FROM sections ORDER BY key ASC").all();
  return NextResponse.json(rows);
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  try {
    const body = await req.json();
    const db = getDb();
    const key = String(body.key || "");
    if (!key) return NextResponse.json({ error: "Key required" }, { status: 400 });

    db.prepare(
      `INSERT INTO sections (key, title, subtitle, content, badge, enabled)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET title = excluded.title, subtitle = excluded.subtitle,
         content = excluded.content, badge = excluded.badge, enabled = excluded.enabled`
    ).run(
      key,
      String(body.title ?? ""),
      String(body.subtitle ?? ""),
      String(body.content ?? ""),
      String(body.badge ?? ""),
      body.enabled ? 1 : 0
    );

    if (notifyEnabled("notify_content_edited")) {
      const siteUrl = getSiteUrl();
      void sendAdminEmail({
        subject: `🧩 Homepage section updated: ${key}`,
        intro: `A homepage section was edited on the site.`,
        rows: [{ label: "Section", value: key }],
        actionHref: `${siteUrl}/admin/sections`,
        actionLabel: "Manage homepage sections"
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save section" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Key required" }, { status: 400 });
  const db = getDb();
  // Guard: never delete core hero keys
  if (/^(hero_|features_|tools_|about_|cta_)/.test(key)) {
    return NextResponse.json({ error: "Core sections cannot be deleted — disable instead" }, { status: 400 });
  }
  db.prepare("DELETE FROM sections WHERE key = ?").run(key);
  return NextResponse.json({ ok: true });
}
