import { NextRequest, NextResponse } from "next/server";
import {
  buildComparisonPdf,
  comparisonSiteName,
  type ComparisonPdfData
} from "@/lib/comparison-pdf";

export const dynamic = "force-dynamic";

/**
 * Free endpoint: renders the 3-way recipe comparison as a PDF.
 * The client sends the fully-computed comparison (values + winners) and
 * receives application/pdf bytes back. Available to everyone — no account
 * or payment required, matching the all-free platform policy.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { data?: ComparisonPdfData };
    const data = body?.data;
    if (
      !data ||
      !Array.isArray(data.recipes) ||
      data.recipes.length === 0 ||
      !Array.isArray(data.metrics)
    ) {
      return NextResponse.json({ error: "Invalid comparison data" }, { status: 400 });
    }

    const bytes = await buildComparisonPdf({
      ...data,
      siteName: data.siteName || comparisonSiteName(),
      generatedAt: data.generatedAt || new Date().toISOString()
    });

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="recipe-comparison.pdf"'
      }
    });
  } catch {
    return NextResponse.json({ error: "Could not generate the PDF." }, { status: 500 });
  }
}
