import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { buildTrafficData } from "@/lib/queries";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * GET /api/admin/stats?days=30 — the traffic dataset for the admin analytics
 * page. Auth-gated; the chart data includes spike (threshold-crossing) days.
 */
export async function GET(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  const raw = parseInt(req.nextUrl.searchParams.get("days") || "30", 10);
  const days = Number.isFinite(raw) ? Math.min(Math.max(raw, 7), 90) : 30;
  return NextResponse.json(buildTrafficData(days));
}
