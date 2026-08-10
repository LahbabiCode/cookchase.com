import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { normalizeResetToken } from "@/lib/reset-token";
import {
  consumePasswordResetToken,
  resetAccountPassword
} from "@/lib/account-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/account/reset-password — validate the one-time token, set the new
 * hash and sign out every device (including the one making the request).
 *
 * The token is consumed atomically inside `consumePasswordResetToken`, so a
 * captured link can never be replayed — even by racing two requests.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = normalizeResetToken(String(body.token || ""));
    const password = String(body.password || "");

    if (!token) {
      return NextResponse.json(
        { error: "This reset link is invalid. Request a new one." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const accountId = consumePasswordResetToken(token);
    if (accountId === null) {
      return NextResponse.json(
        { error: "This reset link is invalid, expired or already used. Request a new one." },
        { status: 400 }
      );
    }

    const hash = bcrypt.hashSync(password, 10);
    resetAccountPassword(accountId, hash);

    return NextResponse.json({
      ok: true,
      message: "Password updated. You can sign in with your new password."
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reset your password. Try again." },
      { status: 500 }
    );
  }
}
