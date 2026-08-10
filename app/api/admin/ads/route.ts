import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  if (!isAdminAuthed()) return unauth();
  const rows = getDb().prepare("SELECT * FROM ads ORDER BY sort_order ASC, id ASC").all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  try {
    const body = await req.json();
    const db = getDb();
    const info = db
      .prepare(
        "INSERT INTO ads (name, location, code, enabled, sort_order) VALUES (?, ?, ?, ?, ?)"
      )
      .run(
        String(body.name || "New ad"),
        String(body.location || "tool_top"),
        String(body.code || ""),
        body.enabled ? 1 : 0,
        Number(body.sort_order || 0)
      );
    return NextResponse.json({ ok: true, id: info.lastInsertRowid });
  } catch {
    return NextResponse.json({ error: "Failed to create ad" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  try {
    const body = await req.json();
    const db = getDb();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    db.prepare(
      "UPDATE ads SET name = ?, location = ?, code = ?, enabled = ?, sort_order = ? WHERE id = ?"
    ).run(
      String(body.name ?? ""),
      String(body.location ?? ""),
      String(body.code ?? ""),
      body.enabled ? 1 : 0,
      Number(body.sort_order || 0),
      id
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update ad" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  getDb().prepare("DELETE FROM ads WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
