import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function parseDensity(body: Record<string, unknown>) {
  const name = String(body.name || "").trim();
  const gPerCup = Number(body.g_per_cup ?? body.gPerCup ?? 0);
  const note = String(body.note || "").trim();
  if (!name) return { error: "Ingredient name is required" };
  if (!isFinite(gPerCup) || gPerCup <= 0) {
    return { error: "Grams per cup must be a positive number" };
  }
  return { name, gPerCup, note };
}

export async function GET() {
  if (!isAdminAuthed()) return unauth();
  const rows = getDb()
    .prepare("SELECT * FROM ingredient_densities ORDER BY name ASC")
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  try {
    const body = await req.json();
    const parsed = parseDensity(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const db = getDb();
    // Unique name — surface a friendly error instead of a raw constraint crash.
    const existing = db
      .prepare("SELECT id FROM ingredient_densities WHERE name = ?")
      .get(parsed.name);
    if (existing) {
      return NextResponse.json(
        { error: "An ingredient with that name already exists" },
        { status: 409 }
      );
    }
    const info = db
      .prepare(
        "INSERT INTO ingredient_densities (name, g_per_cup, note) VALUES (?, ?, ?)"
      )
      .run(parsed.name, parsed.gPerCup, parsed.note);
    return NextResponse.json({ ok: true, id: info.lastInsertRowid });
  } catch {
    return NextResponse.json({ error: "Failed to add ingredient" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const parsed = parseDensity(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const db = getDb();
    const dup = db
      .prepare(
        "SELECT id FROM ingredient_densities WHERE name = ? AND id != ?"
      )
      .get(parsed.name, id);
    if (dup) {
      return NextResponse.json(
        { error: "An ingredient with that name already exists" },
        { status: 409 }
      );
    }
    db.prepare(
      "UPDATE ingredient_densities SET name = ?, g_per_cup = ?, note = ? WHERE id = ?"
    ).run(parsed.name, parsed.gPerCup, parsed.note, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update ingredient" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  getDb().prepare("DELETE FROM ingredient_densities WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
