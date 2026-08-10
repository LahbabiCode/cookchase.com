import { NextResponse } from "next/server";
import { getCurrentAccountId, revokeAccountSession } from "@/lib/account-auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: { sessionId: string } }
) {
  const accountId = getCurrentAccountId();
  if (!accountId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const sessionId = String(params.sessionId || "").slice(0, 64);
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }
  const ok = revokeAccountSession(accountId, sessionId);
  if (!ok) {
    return NextResponse.json(
      { error: "Session not found, or you can't revoke the device you're using. Sign out instead." },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
