import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { sendTestEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const res = await sendTestEmail();
  return NextResponse.json(res);
}
