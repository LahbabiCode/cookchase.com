import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/** List contact-form messages (newest first). */
export async function GET() {
  if (!isAdminAuthed()) return unauth();
  const rows = getDb()
    .prepare(
      "SELECT id, name, email, subject, message, read, created_at FROM contact_messages ORDER BY created_at DESC, id DESC LIMIT 200"
    )
    .all();
  return NextResponse.json(rows);
}

/** Mark a message read/unread: { id, read }. */
export async function PUT(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    getDb().prepare("UPDATE contact_messages SET read = ? WHERE id = ?").run(body.read ? 1 : 0, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}

/** Delete a message: DELETE /api/admin/inbox?id=.. */
export async function DELETE(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  getDb().prepare("DELETE FROM contact_messages WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
