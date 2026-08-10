import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import {
  buildReportData,
  buildReportCsv,
  buildReportPdf,
  type ReportFilter
} from "@/lib/report";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function parseDays(raw: string | null): number {
  const n = parseInt(raw || "30", 10);
  if (Number.isNaN(n) || n < 0) return 30;
  if (n === 0) return 0; // all time
  return Math.min(n, 3650);
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  const format = (req.nextUrl.searchParams.get("format") || "csv").toLowerCase();
  const days = parseDays(req.nextUrl.searchParams.get("days"));

  // Optional report filters: exact category, or status (active|hidden|all).
  const category = (req.nextUrl.searchParams.get("category") || "").trim();
  const statusRaw = (req.nextUrl.searchParams.get("status") || "").trim();
  const filter: ReportFilter = {};
  if (category) filter.category = category;
  if (statusRaw === "active" || statusRaw === "hidden" || statusRaw === "all") {
    filter.status = statusRaw;
  }

  const data = buildReportData(days, filter);

  if (format === "pdf") {
    const bytes = await buildReportPdf(data);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cookchase-report-${stamp()}.pdf"`,
        "Cache-Control": "no-store"
      }
    });
  }

  const csv = buildReportCsv(data);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cookchase-report-${stamp()}.csv"`,
      "Cache-Control": "no-store"
    }
  });
}
