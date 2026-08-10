// Pure data + calculation logic for the Meat Doneness guide.
// Kept free of React so it can be unit-tested without a DOM.

export interface Doneness {
  id: string;
  label: string;
  tempF: number;
  tempC: number;
  desc: string;
}

export interface Meat {
  id: string;
  label: string;
  emoji: string;
  doneness: Doneness[]; // empty = fixed target (poultry/fish)
  safeMinF: number;
  safeMinC: number;
  restMin: string;
  note: string;
}

export const MEATS: Meat[] = [
  {
    id: "beef-steak",
    label: "Beef steak",
    emoji: "🥩",
    doneness: [
      { id: "rare", label: "Rare", tempF: 125, tempC: 52, desc: "Cool red center, very soft" },
      { id: "med-rare", label: "Medium-rare", tempF: 135, tempC: 57, desc: "Warm red center, juicy — the classic" },
      { id: "medium", label: "Medium", tempF: 145, tempC: 63, desc: "Pink center, firmer" },
      { id: "med-well", label: "Medium-well", tempF: 155, tempC: 68, desc: "Slight pink, quite firm" },
      { id: "well", label: "Well done", tempF: 165, tempC: 74, desc: "No pink, dense texture" }
    ],
    safeMinF: 145,
    safeMinC: 63,
    restMin: "5 min",
    note: "Steaks are safe at 145°F with a 3-min rest; many prefer lower for tenderness."
  },
  {
    id: "beef-roast",
    label: "Beef roast / brisket",
    emoji: "🍖",
    doneness: [
      { id: "med-rare", label: "Medium-rare", tempF: 135, tempC: 57, desc: "Rosy center" },
      { id: "medium", label: "Medium", tempF: 145, tempC: 63, desc: "Slightly pink" },
      { id: "well", label: "Well done", tempF: 160, tempC: 71, desc: "Brisket: cook to 203°F for pulling" }
    ],
    safeMinF: 145,
    safeMinC: 63,
    restMin: "15–20 min",
    note: "Brisket and other tough cuts are cooked far beyond safety — to 195–205°F — to break down collagen."
  },
  {
    id: "pork",
    label: "Pork (chops, loin, tenderloin)",
    emoji: "🐷",
    doneness: [
      { id: "medium", label: "Medium (recommended)", tempF: 145, tempC: 63, desc: "Slightly pink, juicy" },
      { id: "well", label: "Well done", tempF: 160, tempC: 71, desc: "White throughout" }
    ],
    safeMinF: 145,
    safeMinC: 63,
    restMin: "3 min",
    note: "Since 2011, the USDA lowered pork's safe minimum to 145°F — pink is fine and better."
  },
  {
    id: "lamb",
    label: "Lamb",
    emoji: "🐑",
    doneness: [
      { id: "rare", label: "Rare", tempF: 130, tempC: 54, desc: "Cool red center" },
      { id: "med-rare", label: "Medium-rare", tempF: 140, tempC: 60, desc: "Pink and tender" },
      { id: "medium", label: "Medium", tempF: 150, tempC: 66, desc: "Light pink center" },
      { id: "well", label: "Well done", tempF: 160, tempC: 71, desc: "Firm, brown center" }
    ],
    safeMinF: 145,
    safeMinC: 63,
    restMin: "10 min",
    note: "Lamb racks are best medium-rare; leg roasts can go medium."
  },
  {
    id: "chicken",
    label: "Chicken",
    emoji: "🍗",
    doneness: [
      { id: "breast", label: "Breast", tempF: 165, tempC: 74, desc: "Juicy if not overcooked — pull at 160°F and rest" },
      { id: "thigh", label: "Thigh / leg", tempF: 175, tempC: 79, desc: "Dark meat is better past 165°F — connective tissue renders" }
    ],
    safeMinF: 165,
    safeMinC: 74,
    restMin: "5–10 min",
    note: "Poultry must reach 165°F — no exceptions. Pulling breast at 160°F lets carryover finish it safely."
  },
  {
    id: "turkey",
    label: "Turkey",
    emoji: "🦃",
    doneness: [
      { id: "whole", label: "Whole bird", tempF: 165, tempC: 74, desc: "Check the thigh joint, not just the breast" },
      { id: "breast", label: "Breast", tempF: 165, tempC: 74, desc: "165°F in the thickest part" }
    ],
    safeMinF: 165,
    safeMinC: 74,
    restMin: "20–30 min",
    note: "A whole turkey rests long enough that carryover adds 5–10°F — pull it 5°F early."
  },
  {
    id: "fish",
    label: "Fish & seafood",
    emoji: "🐟",
    doneness: [
      { id: "medium", label: "Medium (tuna/salmon)", tempF: 125, tempC: 52, desc: "Translucent center — for sushi-grade only" },
      { id: "flaky", label: "Flaky (recommended)", tempF: 145, tempC: 63, desc: "Opaque and flakes easily" }
    ],
    safeMinF: 145,
    safeMinC: 63,
    restMin: "2–3 min",
    note: "The FDA standard is 145°F; for sushi-grade fish, lower temps are a personal choice."
  }
];

export const TEMP_MIN = 100;
export const TEMP_MAX = 210;

/** Position on the 100–210°F thermometer scale, as a percentage (clamped). */
export function thermometerPercent(tempF: number): number {
  return Math.min(100, Math.max(0, ((tempF - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * 100));
}

/** Recommended pull temperature: 5°F below the target to allow carryover. */
export function pullTemp(tempF: number): number {
  return tempF - 5;
}

/** °F → °C conversion used across the doneness table. */
export function fahrenheitToCelsius(f: number): number {
  return Math.round(((f - 32) * 5) / 9);
}
