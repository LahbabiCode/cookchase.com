import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) return unauth();
  const db = getDb();
  const id = Number(params.id);
  const account = db.prepare("SELECT id FROM accounts WHERE id = ?").get(id);
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  const del = db.transaction(() => {
    db.prepare("DELETE FROM account_favorites WHERE account_id = ?").run(id);
    db.prepare("DELETE FROM account_sessions WHERE account_id = ?").run(id);
    db.prepare("DELETE FROM accounts WHERE id = ?").run(id);
  });
  del();
  return NextResponse.json({ ok: true });
}
