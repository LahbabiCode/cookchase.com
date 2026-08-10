import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSiteUrl } from "@/lib/queries";
import { isAdminAuthed } from "@/lib/auth";
import { sendAdminEmail, notifyEnabled } from "@/lib/mail";
import { getAllHubSlugs } from "@/lib/category-hubs";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) return unauth();
  const row = getDb()
    .prepare("SELECT * FROM tools WHERE id = ?")
    .get(Number(params.id));
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) return unauth();
  try {
    const body = await req.json();
    const id = Number(params.id);
    const db = getDb();

    if (typeof body.status === "string" && body.status.length <= 20) {
      db.prepare("UPDATE tools SET status = ? WHERE id = ?").run(body.status, id);
    }

    if (typeof body.slug === "string" && body.slug.trim()) {
      const nextSlug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
      if (getAllHubSlugs().includes(nextSlug)) {
        return NextResponse.json(
          { error: `"${nextSlug}" is a reserved category page URL — pick a different slug` },
          { status: 409 }
        );
      }
    }

    const fields = [
      "name",
      "slug",
      "tagline",
      "category",
      "icon",
      "description",
      "how_to_use",
      "formula",
      "code",
      "faq",
      "tips",
      "quick_guide",
      "example_hint",
      "example_values",
      "meta_title",
      "meta_description"
    ] as const;

    for (const f of fields) {
      if (typeof body[f] === "string") {
        db.prepare(`UPDATE tools SET ${f} = ? WHERE id = ?`).run(body[f], id);
      }
    }

    if (typeof body.featured === "boolean") {
      db.prepare("UPDATE tools SET featured = ? WHERE id = ?").run(body.featured ? 1 : 0, id);
    }
    if (typeof body.sort_order === "number") {
      db.prepare("UPDATE tools SET sort_order = ? WHERE id = ?").run(body.sort_order, id);
    }

    db.prepare("UPDATE tools SET updated_at = datetime('now') WHERE id = ?").run(id);

    if (notifyEnabled("notify_content_edited")) {
      const row = db.prepare("SELECT name, slug, status FROM tools WHERE id = ?").get(id) as
        | { name: string; slug: string; status: string }
        | undefined;
      if (row) {
        const siteUrl = getSiteUrl();
        void sendAdminEmail({
          subject: `✏️ Tool content updated: ${row.name}`,
          intro: `A tool's content was edited on the site.`,
          rows: [
            { label: "Name", value: row.name },
            { label: "Slug", value: row.slug },
            { label: "Status", value: row.status }
          ],
          actionHref: `${siteUrl}/admin/tools`,
          actionLabel: "Manage tools"
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update tool" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) return unauth();
  const db = getDb();
  const info = db.prepare("DELETE FROM tools WHERE id = ?").run(Number(params.id));
  if (info.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
