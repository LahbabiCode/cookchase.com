import { NextResponse } from "next/server";
import { getCurrentAccount, getAccountSettings } from "@/lib/account-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const account = getCurrentAccount();
  if (!account) {
    return NextResponse.json({ loggedIn: false });
  }
  // Every account is free — no Pro tiers or subscriptions anymore.
  return NextResponse.json({
    loggedIn: true,
    email: account.email,
    created_at: account.created_at,
    pro: false,
    plan: "",
    settings: getAccountSettings(account.id)
  });
}
