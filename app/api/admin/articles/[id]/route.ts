import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSiteUrl } from "@/lib/queries";
import { isAdminAuthed } from "@/lib/auth";
import { sendAdminEmail, notifyEnabled } from "@/lib/mail";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) return unauth();
  try {
    const body = await req.json();
    const db = getDb();
    const id = Number(params.id);
    const fields = [
      "title",
      "slug",
      "excerpt",
      "content",
      "category",
      "meta_title",
      "meta_description"
    ] as const;
    for (const f of fields) {
      if (typeof body[f] === "string") {
        db.prepare(`UPDATE articles SET ${f} = ? WHERE id = ?`).run(body[f], id);
      }
    }
    if (typeof body.published === "boolean") {
      db.prepare("UPDATE articles SET published = ? WHERE id = ?").run(body.published ? 1 : 0, id);
    }
    db.prepare("UPDATE articles SET updated_at = datetime('now') WHERE id = ?").run(id);

    if (notifyEnabled("notify_content_edited")) {
      const row = db.prepare("SELECT title, slug FROM articles WHERE id = ?").get(id) as
        | { title: string; slug: string }
        | undefined;
      if (row) {
        const siteUrl = getSiteUrl();
        void sendAdminEmail({
          subject: `✏️ Article content updated: ${row.title}`,
          intro: `A blog article was edited on the site.`,
          rows: [
            { label: "Title", value: row.title },
            { label: "Slug", value: row.slug }
          ],
          actionHref: `${siteUrl}/admin/articles`,
          actionLabel: "Manage articles"
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) return unauth();
  const db = getDb();
  db.prepare("DELETE FROM articles WHERE id = ?").run(Number(params.id));
  return NextResponse.json({ ok: true });
}
