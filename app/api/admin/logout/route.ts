import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("cookchase_admin")?.value;
  if (token) destroySession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("cookchase_admin", "", { path: "/", maxAge: 0 });
  return res;
}
