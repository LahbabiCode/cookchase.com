"use client";

import { useEffect, useMemo, useState } from "react";
import { DENSITIES, DENSITY_MAP } from "./densities";

export interface IngredientDensityItem {
  name: string;
  gPerCup: number;
  note?: string;
}

/**
 * Loads the admin-editable ingredient density list from the API so new
 * ingredients added in the panel appear in the tools without a redeploy.
 * Falls back to the static curated list while loading or on failure, so the
 * tools always have a working density table.
 */
export function useIngredientDensities(): {
  densities: IngredientDensityItem[];
  densityMap: Record<string, number>;
  loading: boolean;
} {
  const [dbDensities, setDbDensities] = useState<IngredientDensityItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ingredients", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled) return;
        if (j && Array.isArray(j.densities) && j.densities.length > 0) {
          setDbDensities(j.densities);
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
    // edits to built-in ingredients and brand-new ingredients both apply.
    const byName = new Map(DENSITIES.map((d) => [d.name, d.gPerCup]));
    const merged: IngredientDensityItem[] = DENSITIES.map((d) => ({ ...d }));
    const seen = new Set(DENSITIES.map((d) => d.name));

    if (dbDensities) {
      for (const row of dbDensities) {
        byName.set(row.name, row.gPerCup);
        if (!seen.has(row.name)) {
          seen.add(row.name);
          merged.push({ name: row.name, gPerCup: row.gPerCup, note: row.note });
        } else {
          const existing = merged.find((m) => m.name === row.name);
          if (existing) existing.gPerCup = row.gPerCup;
        }
      }
    }

    merged.sort((a, b) => a.name.localeCompare(b.name));
    return {
      densities: merged,
      densityMap: Object.fromEntries(byName) as Record<string, number>,
      loading
    };
  }, [dbDensities, loading]);
}

// Kept for tools that need a plain static map as an instant initial value.
export { DENSITY_MAP };
