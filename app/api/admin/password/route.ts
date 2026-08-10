import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const userId = getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { current, next } = await req.json();
    const user = getDb()
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(userId) as { id: number; password_hash: string } | undefined;
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!bcrypt.compareSync(String(current || ""), user.password_hash)) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    if (String(next || "").length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    const hash = bcrypt.hashSync(String(next), 10);
    getDb().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
