// Shareable-state helpers for the Recipe Comparator.
//
// The full three-recipe comparison (names, servings, times and every
// ingredient row) is serialized into a compact URL-safe string and carried in
// the `cmp` query param, so a copied link re-opens the exact same comparison
// on the tool page. Pure functions — unit-tested in tests/comparisonShare.test.ts.

import { FOODS } from "../components/tools/foodData.ts";

export interface SharedIngredient {
  food: string;
  grams: string;
  price: string;
  packageSize: string;
}

export interface SharedRecipe {
  name: string;
  servings: string;
  prep: string;
  cook: string;
  ingredients: SharedIngredient[];
}

/** Safety cap — keeps generated URLs short enough for social platforms. */
const MAX_INGREDIENTS = 24;
const PAYLOAD_VERSION = 1;

// ---- Encode -----------------------------------------------------------------

/**
 * Serialize the comparison into a URL-safe string (base64url of JSON).
 * Round-trips exactly through decodeComparison().
 */
export function encodeComparison(recipes: SharedRecipe[]): string {
  const payload = {
    v: PAYLOAD_VERSION,
    r: recipes.map((r) => ({
      n: r.name || "",
      s: r.servings || "4",
      p: r.prep || "0",
      c: r.cook || "0",
      i: r.ingredients.slice(0, MAX_INGREDIENTS).map((ing) => ({
        f: ing.food,
        g: ing.grams || "100",
        pr: ing.price || "",
        pk: ing.packageSize || ""
      }))
    }))
  };
  const json = JSON.stringify(payload);
  // base64url: `+`→`-`, `/`→`_`, strip padding so the param is URL-safe as-is.
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ---- Decode -----------------------------------------------------------------

/**
 * Restore a comparison from an encoded string. Returns null for anything
 * malformed, wrong-version, or with an implausible shape (never throws).
 * Ingredient names are validated against the known nutrition database and
 * replaced with a safe fallback if a link references a removed food.
 */
export function decodeComparison(encoded: string | null | undefined): SharedRecipe[] | null {
  if (!encoded) return null;
  // Reject oversized payloads before atob/JSON.parse — legitimate share links
  // stay well under this (see the length test). Prevents hostile multi-MB
  // ?cmp= values from being fully decoded and parsed.
  if (encoded.length > 6000) return null;
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(escape(atob(padded)));
    const payload = JSON.parse(json);
    if (
      !payload ||
      payload.v !== PAYLOAD_VERSION ||
      !Array.isArray(payload.r) ||
      payload.r.length < 1 ||
      payload.r.length > 3
    ) {
      return null;
    }
    return payload.r.map((r: Record<string, unknown>) => ({
      name: typeof r.n === "string" ? r.n.slice(0, 80) : "",
      servings: typeof r.s === "string" ? r.s : "4",
      prep: typeof r.p === "string" ? r.p : "0",
      cook: typeof r.c === "string" ? r.c : "0",
      ingredients: (Array.isArray(r.i) ? r.i : [])
        .slice(0, MAX_INGREDIENTS)
        .map((ing: Record<string, unknown>) => {
          const food = typeof ing.f === "string" && FOODS[ing.f] ? ing.f : "Egg (large)";
          return {
            food,
            grams: typeof ing.g === "string" ? ing.g : "100",
            price: typeof ing.pr === "string" ? ing.pr : "",
            packageSize: typeof ing.pk === "string" ? ing.pk : ""
          };
        })
    }));
  } catch {
    return null;
  }
}

// ---- URLs -------------------------------------------------------------------

/**
 * Append `?cmp=<encoded>` (or `&cmp=` when the base already has a query) to a
 * tool page URL.
 */
export function buildShareUrl(base: string, encoded: string): string {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}cmp=${encoded}`;
}

/** Human-friendly share text used in the social intents. */
export const SHARE_TEXT =
  "Three recipes compared side by side — time, cost & nutrition. Which one wins?";

/**
 * Social share intent URLs. Each opens the platform's share dialog in a new
 * tab with the comparison link pre-filled.
 */
export function buildSocialLinks(url: string): {
  x: string;
  facebook: string;
  whatsapp: string;
} {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(SHARE_TEXT);
  return {
    x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    whatsapp: `https://wa.me/?text=${t}%20${u}`
  };
}
