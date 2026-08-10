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
  const rows = getDb().prepare("SELECT * FROM articles ORDER BY created_at DESC").all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  try {
    const body = await req.json();
    const db = getDb();
    const slug = String(body.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (!slug) return NextResponse.json({ error: "Slug required" }, { status: 400 });

    const exists = db.prepare("SELECT id FROM articles WHERE slug = ?").get(slug);
    if (exists) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

    const title = String(body.title || slug);
    const info = db
      .prepare(
        `INSERT INTO articles (slug, title, excerpt, content, category, meta_title, meta_description, published, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
      .run(
        slug,
        title,
        String(body.excerpt || ""),
        String(body.content || ""),
        String(body.category || "Tips"),
        String(body.meta_title || ""),
        String(body.meta_description || ""),
        body.published ? 1 : 0
      );
    if (notifyEnabled("notify_content_edited")) {
      const siteUrl = getSiteUrl();
      void sendAdminEmail({
        subject: `📝 New article created: ${title}`,
        intro: `A new blog article was created on the site.`,
        rows: [
          { label: "Title", value: title },
          { label: "Slug", value: slug },
          { label: "Category", value: String(body.category || "Tips") },
          { label: "Published", value: body.published ? "Yes" : "No" }
        ],
        actionHref: `${siteUrl}/admin/articles`,
        actionLabel: "Manage articles"
      });
    }
    return NextResponse.json({ ok: true, id: info.lastInsertRowid });
  } catch {
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
