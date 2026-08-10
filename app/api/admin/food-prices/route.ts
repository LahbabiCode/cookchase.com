import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function parsePrice(body: Record<string, unknown>) {
  const name = String(body.name || "").trim();
  const pricePerKg = Number(body.price_per_kg ?? body.pricePerKg ?? 0);
  const note = String(body.note || "").trim();
  if (!name) return { error: "Food name is required" };
  if (!isFinite(pricePerKg) || pricePerKg <= 0) {
    return { error: "Price per kg must be a positive number" };
  }
  return { name, pricePerKg, note };
}

export async function GET() {
  if (!isAdminAuthed()) return unauth();
  const rows = getDb()
    .prepare("SELECT * FROM food_prices ORDER BY name ASC")
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  try {
    const body = await req.json();
    const parsed = parsePrice(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const db = getDb();
    // Unique name — surface a friendly error instead of a raw constraint crash.
    const existing = db
      .prepare("SELECT id FROM food_prices WHERE name = ?")
      .get(parsed.name);
    if (existing) {
      return NextResponse.json(
        { error: "A food with that name already exists" },
        { status: 409 }
      );
    }
    const info = db
      .prepare(
        "INSERT INTO food_prices (name, price_per_kg, note) VALUES (?, ?, ?)"
      )
      .run(parsed.name, parsed.pricePerKg, parsed.note);
    return NextResponse.json({ ok: true, id: info.lastInsertRowid });
  } catch {
    return NextResponse.json({ error: "Failed to add food price" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const parsed = parsePrice(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const db = getDb();
    const dup = db
      .prepare("SELECT id FROM food_prices WHERE name = ? AND id != ?")
      .get(parsed.name, id);
    if (dup) {
      return NextResponse.json(
        { error: "A food with that name already exists" },
        { status: 409 }
      );
    }
    db.prepare(
      "UPDATE food_prices SET name = ?, price_per_kg = ?, note = ? WHERE id = ?"
    ).run(parsed.name, parsed.pricePerKg, parsed.note, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update food price" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  getDb().prepare("DELETE FROM food_prices WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
