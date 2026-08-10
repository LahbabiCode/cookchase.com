import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSiteUrl } from "@/lib/queries";
import { isAdminAuthed } from "@/lib/auth";
import { sendAdminEmail, notifyEnabled } from "@/lib/mail";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isAdminAuthed()) return unauth();
  const row = getDb().prepare("SELECT * FROM pages WHERE slug = ?").get(params.slug);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isAdminAuthed()) return unauth();
  try {
    const body = await req.json();
    const db = getDb();
    db.prepare(
      `UPDATE pages SET title = ?, subtitle = ?, content = ?, meta_title = ?, meta_description = ?, updated_at = datetime('now') WHERE slug = ?`
    ).run(
      String(body.title ?? ""),
      String(body.subtitle ?? ""),
      String(body.content ?? ""),
      String(body.meta_title ?? ""),
      String(body.meta_description ?? ""),
      params.slug
    );

    if (notifyEnabled("notify_content_edited")) {
      const siteUrl = getSiteUrl();
      void sendAdminEmail({
        subject: `📄 Page content updated: ${params.slug}`,
        intro: `A static page was edited on the site.`,
        rows: [{ label: "Page", value: params.slug }],
        actionHref: `${siteUrl}/admin/pages`,
        actionLabel: "Manage pages"
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}
