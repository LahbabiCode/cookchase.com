import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  if (!isAdminAuthed()) return unauth();
  const rows = getDb().prepare("SELECT * FROM pages ORDER BY slug ASC").all();
  return NextResponse.json(rows);
}
