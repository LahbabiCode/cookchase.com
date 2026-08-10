import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import {
  getMonthlyReportStatus,
  sendMonthlyReport
} from "@/lib/monthly-report";

export const dynamic = "force-dynamic";

const SECRET_HEADER = "authorization";
const SECRET_PREFIX = "Bearer ";

/**
 * A scheduled call is authorized when:
 *  1. the CRON_SECRET env var is set and the caller sent it as a Bearer token
 *     (Vercel Cron sends this automatically when CRON_SECRET is configured;
 *     external schedulers use scripts/send-monthly-report.js), or
 *  2. an admin is signed in (the settings panel's "Send now" button).
 */
function authorized(req: NextRequest): boolean {
  if (isAdminAuthed()) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get(SECRET_HEADER) || "";
  return header === `${SECRET_PREFIX}${secret}`;
}

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * GET ?status=1 -> current config + last-sent (admin settings panel).
 * GET (plain)    -> trigger the monthly report (Vercel Cron default method).
 */
export async function GET(req: NextRequest) {
  if (!authorized(req)) return unauth();
  if (req.nextUrl.searchParams.get("status") === "1") {
    return NextResponse.json(getMonthlyReportStatus());
  }
  return NextResponse.json(await sendMonthlyReport());
}

/** POST -> trigger the report; ?force=1 bypasses the once-per-month guard. */
export async function POST(req: NextRequest) {
  if (!authorized(req)) return unauth();
  const force = req.nextUrl.searchParams.get("force") === "1";
  return NextResponse.json(await sendMonthlyReport({ force }));
}
