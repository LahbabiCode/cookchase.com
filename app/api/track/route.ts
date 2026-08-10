import { NextRequest, NextResponse } from "next/server";
import { incrementView } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = String(body.slug || "").trim();
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
    incrementView(slug);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
