import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSiteUrl } from "@/lib/queries";
import { isAdminAuthed } from "@/lib/auth";
import { sendAdminEmail, notifyEnabled } from "@/lib/mail";
import { getAllHubSlugs } from "@/lib/category-hubs";
import { isCompleteQuickGuide, parseQuickGuide } from "@/lib/quick-guides";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  if (!isAdminAuthed()) return unauth();
  const rows = getDb().prepare("SELECT * FROM tools ORDER BY sort_order ASC, id ASC").all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  try {
    const body = await req.json();
    const slug = String(body.slug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    if (!slug) return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    if (getAllHubSlugs().includes(slug)) {
      return NextResponse.json(
        { error: `"${slug}" is a reserved category page URL — pick a different slug` },
        { status: 409 }
      );
    }

    const exists = getDb()
      .prepare("SELECT id FROM tools WHERE slug = ?")
      .get(slug);
    if (exists) return NextResponse.json({ error: "Slug already exists" }, { status: 409 });

    // The 3-step Quick guide is mandatory for every new tool: it's shown
    // automatically at the top of the tool page, and an empty guide would
    // leave visitors with no walkthrough. Mirrors the editor's client-side
    // check so a direct API call can't bypass it.
    if (!isCompleteQuickGuide(parseQuickGuide(String(body.quick_guide || "")))) {
      return NextResponse.json(
        {
          error:
            "Every new tool needs a Quick guide: give all 3 steps a title and a one-line description — visitors see this above the tool."
        },
        { status: 422 }
      );
    }

    const name = String(body.name || slug);
    const info = getDb()
      .prepare(
        `INSERT INTO tools (slug, name, tagline, category, icon, description, how_to_use, formula, code, faq, tips, quick_guide, example_hint, example_values, meta_title, meta_description, featured, status, sort_order)
         VALUES (@slug, @name, @tagline, @category, @icon, @description, @how_to_use, @formula, @code, @faq, @tips, @quick_guide, @example_hint, @example_values, @meta_title, @meta_description, @featured, @status, @sort_order)`
      )
      .run({
        slug,
        name,
        tagline: String(body.tagline || ""),
        category: String(body.category || "Calculators"),
        icon: String(body.icon || "Calculator"),
        description: String(body.description || ""),
        how_to_use: String(body.how_to_use || ""),
        formula: String(body.formula || ""),
        code: String(body.code || ""),
        faq: String(body.faq || "[]"),
        tips: String(body.tips || "[]"),
        quick_guide: String(body.quick_guide || "[]"),
        example_hint: String(body.example_hint || ""),
        example_values: String(body.example_values || ""),
        meta_title: String(body.meta_title || ""),
        meta_description: String(body.meta_description || ""),
        featured: body.featured ? 1 : 0,
        status: String(body.status || "active"),
        sort_order: Number(body.sort_order || 0)
      });
    if (notifyEnabled("notify_tool_created")) {
      const siteUrl = getSiteUrl();
      void sendAdminEmail({
        subject: `🛠 New tool created: ${name}`,
        intro: `A new tool was created on the site.`,
        rows: [
          { label: "Name", value: name },
          { label: "Slug", value: slug },
          { label: "Category", value: String(body.category || "Calculators") },
          { label: "Status", value: String(body.status || "active") }
        ],
        actionHref: `${siteUrl}/admin/tools`,
        actionLabel: "Manage tools"
      });
    }
    return NextResponse.json({ ok: true, id: info.lastInsertRowid });
  } catch {
    return NextResponse.json({ error: "Failed to create tool" }, { status: 500 });
  }
}
