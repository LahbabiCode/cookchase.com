import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAccountId } from "@/lib/account-auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const accountId = getCurrentAccountId();
  if (!accountId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  // Ownership check: only the account that saved the result can delete it.
  const info = getDb()
    .prepare("DELETE FROM result_history WHERE id = ? AND account_id = ?")
    .run(id, accountId);
  if (info.changes === 0) {
    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
