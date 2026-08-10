// Pure conversion logic for the Grams ↔ Cups converter (and Measurement→Weight).
// Kept free of React so it can be unit-tested without a DOM.

import { CUP_TO_TBSP, CUP_TO_TSP } from "./densities.ts";

export type Unit = "cup" | "tbsp" | "tsp";

// Single source of truth for cup→spoon factors lives in densities.ts;
// re-export here so callers and tests share the same constants.
export { CUP_TO_TBSP, CUP_TO_TSP };

/** Number of `unit` volumes that make up one cup. */
export function cupToUnitFactor(unit: Unit): number {
  return unit === "cup" ? 1 : unit === "tbsp" ? CUP_TO_TBSP : CUP_TO_TSP;
}

/** Grams for a given volume of an ingredient (grams-per-cup known). */
export function volumeToGrams(amount: number, gPerCup: number, unit: Unit): number {
  return amount * (gPerCup / cupToUnitFactor(unit));
}

/** Volume (in `unit`) for a given weight in grams. */
export function gramsToVolume(grams: number, gPerCup: number, unit: Unit): number {
  return grams / (gPerCup / cupToUnitFactor(unit));
}

/** Full equivalence table in cups / tbsp / tsp for a weight in grams. */
export function gramsEquivalents(
  grams: number,
  gPerCup: number
): { cups: number; tbsp: number; tsp: number } {
  const cups = grams / gPerCup;
  return { cups, tbsp: cups * CUP_TO_TBSP, tsp: cups * CUP_TO_TSP };
}

/** Grams-per-cup for an ingredient name, falling back to 125 (all-purpose flour). */
export function densityFor(ingredient: string, densityMap: Record<string, number>): number {
  return densityMap[ingredient] ?? 125;
}
