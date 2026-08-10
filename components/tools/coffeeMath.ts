// Pure calculation logic for the Coffee & Espresso calculator.
// Kept free of React so it can be unit-tested without a DOM.

export type BrewMethod =
  | "espresso"
  | "pour-over"
  | "drip"
  | "french-press"
  | "moka"
  | "cold-brew";

export interface MethodDef {
  id: BrewMethod;
  label: string;
  icon: string;
  /** Recommended water:coffee range (by weight). */
  ratio: [number, number];
  desc: string;
}

export const METHODS: MethodDef[] = [
  { id: "espresso", label: "Espresso", icon: "☕", ratio: [2, 3], desc: "1 part coffee to 2-3 parts water, by weight" },
  { id: "pour-over", label: "Pour-over", icon: "🫖", ratio: [15, 17], desc: "The golden ratio — bright and balanced" },
  { id: "drip", label: "Drip machine", icon: "☕", ratio: [15, 18], desc: "What most auto-drip brewers recommend" },
  { id: "french-press", label: "French press", icon: "🍵", ratio: [12, 15], desc: "Full-bodied — use a bit more coffee" },
  { id: "moka", label: "Moka pot", icon: "🍶", ratio: [10, 12], desc: "Strong and rich, close to espresso" },
  { id: "cold-brew", label: "Cold brew", icon: "🧊", ratio: [8, 12], desc: "Concentrated — dilute before drinking" }
];

export interface EspressoStyle {
  id: "ristretto" | "normale" | "lungo";
  label: string;
  /** dose:yield ratio (e.g. [1, 2] means 1 g coffee → 2 ml yield). */
  ratio: [number, number];
  desc: string;
}

export const ESPRESSO_STYLES: EspressoStyle[] = [
  { id: "ristretto", label: "Ristretto", ratio: [1, 1.5], desc: "Short, intense, syrupy" },
  { id: "normale", label: "Normale", ratio: [1, 2], desc: "The classic 1:2 shot" },
  { id: "lungo", label: "Lungo", ratio: [1, 3], desc: "Longer pull, more diluted" }
];

/** Water : coffee ratio as a number (e.g. 16 for a 1:16 brew). 0 when no coffee. */
export function brewRatio(waterMl: number, coffeeG: number): number {
  return coffeeG > 0 ? waterMl / coffeeG : 0;
}

/** True when the actual ratio sits inside the method's recommended range. */
export function isBalancedRatio(ratio: number, range: [number, number]): boolean {
  return ratio >= range[0] && ratio <= range[1];
}

/** Brew strength classification used in the result panel. */
export function brewStrength(ratio: number, range: [number, number]): "balanced" | "weak" | "strong" {
  if (isBalancedRatio(ratio, range)) return "balanced";
  return ratio > range[1] ? "weak" : "strong";
}

/** Espresso yield for a single shot: dose × yield multiplier. */
export function espressoYieldPerShot(doseG: number, yieldMultiplier: number): number {
  return doseG * yieldMultiplier;
}

/** Total dose and yield for a batch of shots. */
export function espressoTotals(
  doseG: number,
  yieldMultiplier: number,
  shots: number
): { dose: number; yield: number } {
  const perShot = espressoYieldPerShot(doseG, yieldMultiplier);
  return { dose: doseG * shots, yield: perShot * shots };
}

/** Golden rule of brewing: 60 g coffee per litre of water → ≈ 1:16.7. */
export const GOLDEN_RULE_RATIO = 1000 / 60;
