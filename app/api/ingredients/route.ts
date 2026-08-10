import { NextResponse } from "next/server";
import { getIngredientDensities } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * Public endpoint for the tool widgets. Returns the editable ingredient
 * density list (grams per US cup) so admin-added ingredients appear in the
 * Grams↔Cups converter and Measurement→Weight tool without redeploying.
 */
export async function GET() {
  const rows = getIngredientDensities();
  return NextResponse.json({
    densities: rows.map((r) => ({ name: r.name, gPerCup: r.g_per_cup, note: r.note }))
  });
}
