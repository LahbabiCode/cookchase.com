import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentAccountId,
  getAccountSettings,
  updateAccountSettings
} from "@/lib/account-auth";
import { sanitizeSettings } from "@/lib/settings-utils";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Sign in required" }, { status: 401 });
}

export async function GET() {
  const accountId = getCurrentAccountId();
  if (!accountId) return unauth();
  return NextResponse.json({ settings: getAccountSettings(accountId) });
}

export async function PUT(req: NextRequest) {
  const accountId = getCurrentAccountId();
  if (!accountId) return unauth();
  try {
    const body = await req.json().catch(() => ({}));
    const current = getAccountSettings(accountId);
    const next = sanitizeSettings(body, current);
    updateAccountSettings(accountId, next);
    return NextResponse.json({ ok: true, settings: next });
  } catch {
    return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  }
}
