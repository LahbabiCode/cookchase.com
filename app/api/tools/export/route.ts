import { NextRequest, NextResponse } from "next/server";
import { buildResultsPdf, type ResultRowData } from "@/lib/result-pdf";
import { getSetting } from "@/lib/queries";
import { sanitizeRows, clampStr } from "@/lib/history-utils";

export const dynamic = "force-dynamic";

/**
 * Free endpoint: renders any tool's calculated results as a clean PDF.
 * The client sends label/value rows (already formatted) and receives
 * application/pdf bytes. Available to everyone — no account or payment
 * required, matching the all-free platform policy.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows: ResultRowData[] = sanitizeRows(body.rows, 120);
    if (rows.length === 0) {
      return NextResponse.json({ error: "No results to export" }, { status: 400 });
    }

    const toolName = clampStr(body.toolName, 160) || "Results";
    const toolSlug = clampStr(body.toolSlug, 120) || "results";
    const siteName = getSetting("site_name") || "CookChase";

    const bytes = await buildResultsPdf({
      siteName,
      generatedAt: body.generatedAt || new Date().toISOString(),
      toolName,
      toolSlug,
      rows
    });

    const filename = toolSlug.replace(/[^a-z0-9-]+/gi, "-").replace(/^-+|-+$/g, "") || "results";
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`
      }
    });
  } catch {
    return NextResponse.json({ error: "Could not generate the PDF." }, { status: 500 });
  }
}
