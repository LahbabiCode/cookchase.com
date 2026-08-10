import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  if (!isAdminAuthed()) return unauth();
  const rows = getDb()
    .prepare(
      `SELECT a.id, a.email, a.created_at,
              (SELECT COUNT(*) FROM account_favorites f WHERE f.account_id = a.id) AS favorites
       FROM accounts a
       ORDER BY a.created_at DESC`
    )
    .all() as {
    id: number;
    email: string;
    created_at: string;
    favorites: number;
  }[];
  return NextResponse.json(rows);
}
