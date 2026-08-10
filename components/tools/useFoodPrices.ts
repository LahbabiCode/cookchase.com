"use client";

import { useEffect, useMemo, useState } from "react";
import { FOOD_PRICES, PRICE_MAP, normalizeFoodName } from "./foodPrices";

export interface FoodPriceItem {
  name: string;
  pricePerKg: number;
  note?: string;
}

/**
 * Loads the admin-editable food price list from the API so new foods added in
 * the panel appear in the cost tools without a redeploy. Falls back to the
 * static curated list while loading or on failure, so the tools always have a
 * working price table. The map is keyed by NORMALIZED name (lowercase, trimmed)
 * so lookups are case/space tolerant.
 */
export function useFoodPrices(): {
  prices: FoodPriceItem[];
  priceMap: Record<string, number>;
  loading: boolean;
} {
  const [dbPrices, setDbPrices] = useState<FoodPriceItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/food-prices", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        if (j && Array.isArray(j.prices) && j.prices.length > 0) {
          setDbPrices(j.prices);
        }
      })
      .catch(() => {
        /* keep the static fallback */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    // Merge: start from the static defaults, then overlay DB rows so admin
    // edits to built-in foods and brand-new foods both apply.
    const byNorm = new Map<string, number>();
    for (const p of FOOD_PRICES) byNorm.set(normalizeFoodName(p.name), p.pricePerKg);
    const merged: FoodPriceItem[] = FOOD_PRICES.map((p) => ({ ...p }));
    const seen = new Set(FOOD_PRICES.map((p) => normalizeFoodName(p.name)));

    if (dbPrices) {
      for (const row of dbPrices) {
        const key = normalizeFoodName(row.name);
        byNorm.set(key, row.pricePerKg);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push({ name: row.name, pricePerKg: row.pricePerKg, note: row.note });
        } else {
          const existing = merged.find((m) => normalizeFoodName(m.name) === key);
          if (existing) existing.pricePerKg = row.pricePerKg;
        }
      }
    }

    merged.sort((a, b) => a.name.localeCompare(b.name));
    return {
      prices: merged,
      priceMap: Object.fromEntries(byNorm) as Record<string, number>,
      loading
    };
  }, [dbPrices, loading]);
}

// Kept for tools that need a plain static map as an instant initial value.
export { PRICE_MAP };
