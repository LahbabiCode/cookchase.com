// Shared food price database: average US supermarket price per KILOGRAM for
// common kitchen ingredients. The Recipe Cost Calculator and Recipe Comparator
// use these to estimate a row's cost automatically when the visitor leaves the
// price blank. Prices are editable from the admin panel (Food Prices page);
// the tools read the live table so admin edits apply without redeploying.
export interface FoodPrice {
  name: string;
  pricePerKg: number; // USD per kilogram
  note?: string;
}

// Prices are typical US supermarket averages (2024–25, USD per kg). The names
// deliberately match the nutrition keys in foodData.ts (Recipe Comparator's
// ingredient dropdown) plus the common free-text ingredients used in the
// Recipe Cost Calculator examples, so lookups succeed for real-world input.
export const FOOD_PRICES: FoodPrice[] = [
  // Proteins
  { name: "Chicken breast (raw)", pricePerKg: 7.5, note: "boneless, skinless" },
  { name: "Chicken thighs", pricePerKg: 5.5, note: "boneless" },
  { name: "Beef mince (10% fat)", pricePerKg: 8.5 },
  { name: "Ground beef", pricePerKg: 8.5, note: "80/20" },
  { name: "Salmon fillet", pricePerKg: 22 },
  { name: "Cod fillet", pricePerKg: 16 },
  { name: "Shrimp", pricePerKg: 14, note: "frozen, shell-on" },
  { name: "Tuna (canned in water)", pricePerKg: 9 },
  { name: "Pork chop", pricePerKg: 7 },
  { name: "Bacon (raw)", pricePerKg: 10 },
  { name: "Egg (large)", pricePerKg: 4.5, note: "≈ $2.70/dozen" },
  { name: "Tofu (firm)", pricePerKg: 4 },
  // Dairy & eggs
  { name: "Milk (whole)", pricePerKg: 1.2 },
  { name: "Cream (heavy)", pricePerKg: 5 },
  { name: "Butter", pricePerKg: 9 },
  { name: "Cheddar cheese", pricePerKg: 11 },
  { name: "Mozzarella", pricePerKg: 10 },
  { name: "Feta cheese", pricePerKg: 12 },
  { name: "Parmesan", pricePerKg: 18 },
  { name: "Cream cheese", pricePerKg: 8 },
  { name: "Greek yogurt", pricePerKg: 5 },
  { name: "Plain yogurt", pricePerKg: 4 },
  { name: "Sour cream", pricePerKg: 4.5 },
  // Grains, pasta & baking
  { name: "White rice (dry)", pricePerKg: 2.5 },
  { name: "Rice", pricePerKg: 2.5 },
  { name: "Brown rice (dry)", pricePerKg: 3 },
  { name: "Pasta (dry)", pricePerKg: 2 },
  { name: "Spaghetti", pricePerKg: 2 },
  { name: "Couscous (dry)", pricePerKg: 3.5 },
  { name: "Quinoa (dry)", pricePerKg: 7 },
  { name: "Oats (rolled)", pricePerKg: 2.5 },
  { name: "All-purpose flour", pricePerKg: 1.5 },
  { name: "Bread flour", pricePerKg: 2 },
  { name: "Bread (white)", pricePerKg: 4 },
  { name: "Flour tortilla", pricePerKg: 4 },
  { name: "Corn tortilla", pricePerKg: 3.5 },
  { name: "Sugar", pricePerKg: 1.5 },
  { name: "Honey", pricePerKg: 9 },
  { name: "Chocolate chips", pricePerKg: 11 },
  { name: "Peanut butter", pricePerKg: 6 },
  { name: "Almonds", pricePerKg: 14 },
  { name: "Ground almonds", pricePerKg: 15 },
  { name: "Walnuts", pricePerKg: 16 },
  { name: "Cashews", pricePerKg: 15 },
  // Produce
  { name: "Potato (raw)", pricePerKg: 2 },
  { name: "Sweet potato", pricePerKg: 2.5 },
  { name: "Tomato", pricePerKg: 3.5 },
  { name: "Tomatoes", pricePerKg: 3.5 },
  { name: "Canned tomatoes", pricePerKg: 2 },
  { name: "Tomato passata", pricePerKg: 2.5 },
  { name: "Tomato paste", pricePerKg: 5 },
  { name: "Onion", pricePerKg: 1.8 },
  { name: "Garlic", pricePerKg: 8 },
  { name: "Carrot", pricePerKg: 1.5 },
  { name: "Broccoli", pricePerKg: 3 },
  { name: "Spinach", pricePerKg: 4, note: "fresh, bagged" },
  { name: "Avocado", pricePerKg: 5 },
  { name: "Banana", pricePerKg: 1.5 },
  { name: "Apple", pricePerKg: 3 },
  { name: "Lemon", pricePerKg: 3 },
  { name: "Lime", pricePerKg: 4 },
  { name: "Ginger", pricePerKg: 6 },
  { name: "Mushrooms", pricePerKg: 6 },
  { name: "Bell pepper", pricePerKg: 4 },
  { name: "Zucchini", pricePerKg: 3 },
  { name: "Cauliflower", pricePerKg: 3.5 },
  { name: "Cucumber", pricePerKg: 2.5 },
  { name: "Green beans", pricePerKg: 5 },
  { name: "Corn (canned)", pricePerKg: 2 },
  { name: "Peas (frozen)", pricePerKg: 3 },
  { name: "Sweetcorn (cob)", pricePerKg: 3 },
  { name: "Fresh herbs", pricePerKg: 20, note: "cilantro, parsley, etc." },
  // Pantry & condiments
  { name: "Olive oil", pricePerKg: 12, note: "≈ $9/L" },
  { name: "Soy sauce", pricePerKg: 5 },
  { name: "Coconut milk", pricePerKg: 4, note: "canned" },
  { name: "Chicken stock", pricePerKg: 3 },
  { name: "Hummus", pricePerKg: 7 },
  { name: "Black beans (cooked)", pricePerKg: 2.5 },
  { name: "Lentils (cooked)", pricePerKg: 2.5 },
  { name: "Chili flakes", pricePerKg: 18 },
  { name: "Cumin (ground)", pricePerKg: 12 },
  { name: "Paprika", pricePerKg: 10 }
];

export const PRICE_MAP: Record<string, number> = Object.fromEntries(
  FOOD_PRICES.map((p) => [p.name, p.pricePerKg])
);

/**
 * Normalize a typed ingredient name for lookup: lowercase, trimmed, inner
 * whitespace collapsed. Keeps case/space differences from breaking matches
 * while staying exact on the actual words.
 */
export function normalizeFoodName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Price per kg for a food by normalized name, or undefined when unknown. */
export function findPricePerKg(
  name: string,
  map: Record<string, number> = PRICE_MAP
): number | undefined {
  const norm = normalizeFoodName(name);
  if (!norm) return undefined;
  // Exact match first (covers "Tomatoes" vs "Tomatoes").
  const exact = Object.keys(map).find((k) => normalizeFoodName(k) === norm);
  if (exact !== undefined) return map[exact];
  // Singular/plural tolerant fallback: "tomatoes" → "tomato" (strip trailing
  // "es"), otherwise "peas" → "pea" (strip trailing "s"). Only words longer
  // than 3 chars are touched so "gas" or "lens" never get mangled.
  const singular = norm.endsWith("es")
    ? norm.slice(0, -2)
    : norm.endsWith("s")
      ? norm.slice(0, -1)
      : "";
  if (singular && singular.length > 2) {
    const hit = Object.keys(map).find((k) => normalizeFoodName(k) === singular);
    if (hit !== undefined) return map[hit];
  }
  // Case/space-insensitive substring fallback for long names (e.g. a visitor
  // typing "chicken breast" for "Chicken breast (raw)").
  const loose = Object.keys(map).find(
    (k) => normalizeFoodName(k).includes(norm) || norm.includes(normalizeFoodName(k))
  );
  return loose !== undefined ? map[loose] : undefined;
}

/**
 * Estimated cost of an ingredient amount in grams, priced at the food's
 * average dollars-per-kilogram rate. Pure so it is unit-testable.
 */
export function estimateCost(
  grams: number,
  pricePerKg: number | undefined
): number {
  if (!isFinite(grams) || grams <= 0) return 0;
  if (!isFinite(pricePerKg ?? NaN) || !pricePerKg || pricePerKg <= 0) return 0;
  return (grams / 1000) * pricePerKg;
}
