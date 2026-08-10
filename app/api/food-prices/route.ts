import { NextResponse } from "next/server";
import { getFoodPrices } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
 * Public endpoint for the tool widgets. Returns the editable food price list
 * (avg supermarket USD per kg) so admin-added foods appear in the Recipe Cost
 * and Recipe Comparator tools without redeploying.
 */
export async function GET() {
  const rows = getFoodPrices();
  return NextResponse.json({
    prices: rows.map((r) => ({ name: r.name, pricePerKg: r.price_per_kg, note: r.note }))
  });
}
