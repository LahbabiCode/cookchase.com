// Reproducible random "Try an example" values.
//
// The admin-editable example config (lib/tool-examples.ts + tools.example_values)
// gives every tool ONE fixed example. This module makes the button livelier:
// each press fills a *different* example from the same realistic category —
// e.g. a different serving count, a different protein, a different brew ratio —
// so visitors see the tool working with fresh values instead of the same ones
// every time.
//
// The randomness is SEEDED: buildExampleVariant(slug, base, seed) is pure, so
// the same (slug, base, seed) always yields the same values. That keeps the
// feature reproducible and unit-testable, and it lets the client store hand
// out a new seed (press counter) per click. Ranges and option lists below are
// copied from each widget's own inputs so the generated values are always
// accepted by the widget (no unknown enum values, no off-scale sliders).
//
// This module is PURE (standard library only) so node --test can load it.

/** Deterministic 32-bit PRNG (mulberry32). Returns a function producing [0,1). */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random element of a non-empty array. */
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Remove float noise so values land exactly on the step (2.3000000000000003 → 2.3). */
function snap(n: number, step: number): number {
  return Math.round(n / step) * step;
}

/** Random number in [min, max] at the given step (inclusive on both ends). */
function numIn(rng: () => number, min: number, max: number, step = 1): number {
  if (max <= min) return snap(min, step);
  const steps = Math.max(1, Math.round((max - min) / step));
  const n = min + Math.floor(rng() * (steps + 1)) * step;
  return snap(n, step);
}

/** Keep the value in the same type as the base field (number stays number, string stays string). */
function typed(baseVal: unknown, n: number): string | number {
  return typeof baseVal === "number" ? n : String(n);
}

/** Base field value with a fallback for a missing key (admin may have deleted it). */
function val(b: Record<string, unknown>, key: string, fb: unknown): unknown {
  return key in b ? b[key] : fb;
}

// ---------------------------------------------------------------------------
// Valid option lists, copied from the widgets' own data (see components/tools).
// ---------------------------------------------------------------------------

const SOUS_VIDE_PROTEINS = ["steak", "chickenBreast", "chickenThigh", "porkChop", "salmon", "egg", "vegetables"];
/** How many doneness options each sous-vide protein has (idx must stay < count). */
const SOUS_VIDE_OPTIONS: Record<string, number> = {
  steak: 4,
  chickenBreast: 2,
  chickenThigh: 1,
  porkChop: 2,
  salmon: 2,
  egg: 3,
  vegetables: 2
};

const SWEETENERS = ["honey", "maple", "agave", "cornSyrup", "erythritol", "xylitol", "stevia", "monkFruit", "coconutSugar"];

const ALCOHOLS = ["wine", "beer", "sake", "vermouth", "brandy", "rum"];
const COOK_METHODS = ["raw", "flambe", "bake15", "simmer15", "simmer30", "simmer60", "simmer150"];

const BRINE_GUIDES = ["chicken", "turkey", "chops", "shrimp"];

const EGG_STYLES = ["soft", "medium", "hard"];

const SHELF_LIFE_IDS = [
  "milk",
  "eggs",
  "raw-chicken",
  "raw-beef",
  "cooked-leftovers",
  "deli-meat",
  "fish",
  "yogurt",
  "hard-cheese",
  "soft-cheese",
  "butter",
  "bread",
  "berries",
  "lettuce",
  "cooked-rice",
  "open-wine",
  "mayo",
  "canned-goods"
];
const STORAGES = ["pantry", "fridge", "freezer"];

/** Substrings that match at least one entry in FoodStorageGuide's FOODS list. */
const STORAGE_QUERIES = [
  "chicken",
  "milk",
  "eggs",
  "butter",
  "cheese",
  "fish",
  "shrimp",
  "yogurt",
  "tomatoes",
  "potatoes",
  "berries",
  "apples",
  "bananas",
  "garlic",
  "carrots",
  "greens"
];

const SUBSTITUTION_KEYS = [
  "buttermilk",
  "egg",
  "brown sugar",
  "butter",
  "heavy cream",
  "sour cream",
  "maple syrup",
  "corn starch",
  "baking powder",
  "baking soda",
  "honey",
  "olive oil",
  "soy sauce",
  "red wine",
  "white wine",
  "cream of tartar",
  "molasses",
  "bread flour",
  "self-rising flour",
  "cake flour",
  "fresh herbs",
  "garlic",
  "vanilla extract"
];

const MEAT_CUTS = ["beefRoast", "chickenWhole", "turkey", "porkLoin", "lambLeg", "fish"];

/** Meat ids + which doneness ids are valid for each (MeatDonenessGuide). */
const DONENESS_BY_MEAT: Record<string, string[]> = {
  "beef-steak": ["rare", "med-rare", "medium", "med-well", "well"],
  "beef-roast": ["med-rare", "medium", "well"],
  pork: ["medium", "well"],
  lamb: ["rare", "med-rare", "medium", "well"],
  chicken: ["breast", "thigh"],
  turkey: ["whole", "breast"],
  fish: ["medium", "flaky"]
};

const PRESSURE_FOODS: Record<string, number> = {
  chickenBreast: 500,
  chickenThighs: 500,
  wholeChicken: 1500,
  beefChuck: 1000,
  porkShoulder: 1500,
  porkRibs: 1000,
  soakedBeans: 500,
  unsoakedBeans: 500,
  whiteRice: 0,
  potatoes: 800
};

const VOLUME_UNITS = ["cup", "tbsp", "tsp", "fl oz", "ml", "liter"];
const WEIGHT_UNITS = ["g", "kg", "oz", "lb"];

const BREW_METHODS = ["espresso", "pour-over", "drip", "french-press", "moka", "cold-brew"];
const ESPRESSO_STYLES = ["ristretto", "normale", "lungo"];

const GRAMS_UNITS = ["cup", "tbsp", "tsp"];
const CLIMATES = ["mild", "hot", "veryHot"];

/** Base grams used by the caffeine rows so jittered amounts stay realistic. */
function caffeineMlRange(type: string): [number, number] {
  switch (type) {
    case "espresso":
      return [40, 90];
    case "blackTea":
      return [200, 350];
    case "cola":
      return [250, 400];
    default: // drip, filter…
      return [180, 360];
  }
}

// ---------------------------------------------------------------------------
// Per-tool variant rules. Each receives the admin base values and an rng, and
// returns the values the button should fill this press. Fields not mentioned
// are kept from the base. Rules that are absent (weekly-menu-generator,
// recipe-comparator) simply keep the base values.
// ---------------------------------------------------------------------------

type Rule = (base: Record<string, unknown>, rng: () => number) => Record<string, unknown>;

/**
 * All per-tool variant rules, keyed by tool slug. Exported for the coverage
 * test that guards against a new tool shipping without a rule.
 */
export const RULES: Record<string, Rule> = {
  "caffeine-calculator": (b, r) => {
    const rows = Array.isArray(b.rows)
      ? (b.rows as { type: string; ml: string }[]).map((row) => {
          const [lo, hi] = caffeineMlRange(row.type);
          return { ...row, ml: typed(row.ml, numIn(r, lo, hi, 10)) };
        })
      : b.rows;
    return { ...b, rows };
  },

  "water-intake": (b, r) => ({
    weight: typed(val(b, "weight", "70"), numIn(r, 50, 95, 5)),
    unit: b.unit ?? "kg",
    activity: numIn(r, 15, 120, 15),
    climate: pick(r, CLIMATES)
  }),

  "recipe-scaler": (b, r) => {
    const original = numIn(r, 4, 8, 2);
    const mult = pick(r, [1.5, 2, 3]);
    return {
      ...b,
      original: String(original),
      desired: String(Math.round(original * mult))
    };
  },

  "temperature-converter": (b, r) => {
    const mode = pick(r, ["f", "c"]);
    return {
      ...b,
      mode,
      value: mode === "f" ? String(numIn(r, 225, 450, 5)) : String(numIn(r, 105, 230, 5))
    };
  },

  "unit-converter": (b, r) => {
    const category = pick(r, ["volume", "weight"]);
    const units = category === "volume" ? VOLUME_UNITS : WEIGHT_UNITS;
    const from = pick(r, units);
    const rest = units.filter((u) => u !== from);
    const to = pick(r, rest);
    return {
      ...b,
      category,
      amount: typed(val(b, "amount", "1"), numIn(r, 0.25, 4, 0.25)),
      from,
      to
    };
  },

  "sweetener-converter": (b, r) => ({
    ...b,
    sugar: typed(val(b, "sugar", "100"), numIn(r, 50, 200, 10)),
    sweetener: pick(r, SWEETENERS)
  }),

  "sous-vide-guide": (b, r) => {
    const protein = pick(r, SOUS_VIDE_PROTEINS);
    const max = SOUS_VIDE_OPTIONS[protein] - 1;
    return { ...b, protein, idx: numIn(r, 0, max, 1) };
  },

  "sourdough-calculator": (b, r) => {
    const current = numIn(r, 40, 120, 10);
    const target = numIn(r, current + 100, Math.max(current + 120, 500), 10);
    return { ...b, current: String(current), target: String(target), ratio: numIn(r, 1, 3, 1) };
  },

  "grams-cups-converter": (b, r) => {
    const direction = (b.direction as string) || "volume-to-weight";
    if (direction === "weight-to-volume") {
      return {
        ...b,
        grams: typed(val(b, "grams", "340"), numIn(r, 100, 500, 25)),
        unit: b.unit ?? "cup"
      };
    }
    return {
      ...b,
      amount: typed(val(b, "amount", "1"), numIn(r, 0.25, 3, 0.25)),
      unit: pick(r, GRAMS_UNITS)
    };
  },

  "alcohol-cookoff": (b, r) => ({
    ...b,
    volume: typed(val(b, "volume", "250"), numIn(r, 100, 500, 50)),
    alcohol: pick(r, ALCOHOLS),
    method: pick(r, COOK_METHODS)
  }),

  "bread-hydration": (b, r) => ({
    flour: typed(val(b, "flour", "500"), numIn(r, 400, 800, 50)),
    hydration: numIn(r, 62, 80, 2),
    saltPct: numIn(r, 1.5, 2.5, 0.1),
    yeastPct: numIn(r, 0.5, 1.5, 0.1)
  }),

  "brine-calculator": (b, r) => ({
    ...b,
    weight: typed(val(b, "weight", "1.5"), numIn(r, 1, 2.5, 0.5)),
    mode: pick(r, ["wet", "dry"]),
    saltPct: numIn(r, 3, 8, 1),
    guide: pick(r, BRINE_GUIDES)
  }),

  "egg-timer": (b, r) => ({
    ...b,
    styleId: pick(r, EGG_STYLES),
    altitude: typed(val(b, "altitude", "0"), numIn(r, 0, 3000, 500))
  }),

  "food-shelf-life": (b, r) => ({
    ...b,
    foodId: pick(r, SHELF_LIFE_IDS),
    storage: pick(r, STORAGES)
  }),

  "food-storage-guide": (b, r) => ({
    ...b,
    query: pick(r, STORAGE_QUERIES)
  }),

  "frying-temperature": (b, r) => {
    const f = numIn(r, 325, 375, 5);
    return { ...b, f: String(f), c: String(Math.round(((f - 32) * 5) / 9 * 10) / 10) };
  },

  "ingredient-substitution": (b, r) => {
    const key = pick(r, SUBSTITUTION_KEYS);
    return { ...b, query: key, selected: key };
  },

  "kitchen-timers": (b, r) => {
    const timers = Array.isArray(b.timers)
      ? (b.timers as { name: string; duration: number }[]).map((t) => ({
          name: t.name,
          duration: numIn(r, Math.max(30, Math.round(t.duration / 2)), Math.min(5400, t.duration * 2), 15)
        }))
      : b.timers;
    return { ...b, timers };
  },

  "meal-prep-planner": (b, r) => ({
    ...b,
    days: numIn(r, 4, 7, 1),
    calGoal: pick(r, [1500, 1800, 2000, 2200, 2500, 3000]),
    budget: pick(r, [20, 25, 30, 35, 40, 50])
  }),

  "measurement-to-weight": (b, r) => {
    const rows = Array.isArray(b.rows)
      ? (b.rows as { ingredient: string; amount: string; unit: string }[]).map((row) => ({
          ...row,
          amount: typed(row.amount, numIn(r, 0.25, 4, 0.25))
        }))
      : b.rows;
    return { ...b, rows };
  },

  "meat-cooking-time": (b, r) => ({
    ...b,
    meat: pick(r, MEAT_CUTS),
    weight: typed(val(b, "weight", "1.5"), numIn(r, 0.8, 2.5, 0.1))
  }),

  "meat-doneness-guide": (b, r) => {
    const meatIds = Object.keys(DONENESS_BY_MEAT);
    const meatId = pick(r, meatIds);
    const donenessId = pick(r, DONENESS_BY_MEAT[meatId]);
    return { ...b, meatId, donenessId };
  },

  "nutrition-calculator": (b, r) => {
    const rows = Array.isArray(b.rows)
      ? (b.rows as { food: string; grams: string }[]).map((row) => ({
          ...row,
          grams: typed(row.grams, numIn(r, 50, 800, 25))
        }))
      : b.rows;
    return { ...b, servings: typed(val(b, "servings", "4"), numIn(r, 2, 8, 1)), rows };
  },

  "pizza-dough-calculator": (b, r) => ({
    ...b,
    pizzas: typed(val(b, "pizzas", "2"), numIn(r, 1, 4, 1)),
    ballWeight: typed(val(b, "ballWeight", "280"), numIn(r, 220, 320, 20)),
    hydration: numIn(r, 60, 70, 1),
    yeastPct: numIn(r, 0.1, 0.5, 0.05)
  }),

  "pressure-cooker-converter": (b, r) => {
    const foods = Object.keys(PRESSURE_FOODS);
    const food = pick(r, foods);
    const base = PRESSURE_FOODS[food];
    return {
      ...b,
      food,
      weight: base === 0 ? "0" : String(numIn(r, Math.max(300, base / 2), base * 2, 100))
    };
  },

  "recipe-cost-calculator": (b, r) => {
    const rows = Array.isArray(b.rows)
      ? (b.rows as { name: string; amount: string; price: string; packageSize?: string }[]).map((row) => ({
          ...row,
          amount: typed(row.amount, numIn(r, 50, 800, 25)),
          price: typed(row.price, numIn(r, 0.5, 8, 0.5))
        }))
      : b.rows;
    return { ...b, servings: typed(val(b, "servings", "4"), numIn(r, 2, 8, 1)), rows };
  },

  "dough-batch-converter": (b, r) => ({
    ...b,
    target: typed(val(b, "target", "1200"), numIn(r, 700, 1600, 50)),
    hydration: typed(val(b, "hydration", "72"), numIn(r, 65, 75, 1)),
    saltPct: typed(val(b, "saltPct", "2.1"), numIn(r, 1.8, 2.4, 0.1)),
    flourSplit: typed(val(b, "flourSplit", "20"), numIn(r, 10, 30, 5))
  }),

  "coffee-espresso-calculator": (b, r) => {
    const method = pick(r, BREW_METHODS);
    if (method === "espresso") {
      return {
        ...b,
        method,
        coffee: typed(val(b, "coffee", "18"), numIn(r, 16, 22, 1)),
        shots: typed(val(b, "shots", "1"), numIn(r, 1, 2, 1)),
        espressoStyle: pick(r, ESPRESSO_STYLES)
      };
    }
    const coffee = numIn(r, 15, 30, 1);
    const ratio = numIn(r, 12, 17, 1);
    return { ...b, method, coffee: String(coffee), water: String(coffee * ratio) };
  },

  "baking-pan-converter": (b, r) => {
    const dim = (shape: string, cur: Record<string, unknown>): Record<string, unknown> => {
      if (shape === "round") return { ...cur, d: String(numIn(r, 6, 12, 1)) };
      if (shape === "square") return { ...cur, w: String(numIn(r, 6, 12, 1)), l: String(numIn(r, 6, 12, 1)) };
      return { ...cur, w: String(numIn(r, 8, 13, 1)), l: String(numIn(r, 9, 15, 1)) };
    };
    const orig = (b.orig as Record<string, unknown>) ?? {};
    const target = (b.target as Record<string, unknown>) ?? {};
    return {
      ...b,
      orig: dim((orig.shape as string) || "round", orig),
      target: dim((target.shape as string) || "rectangle", target)
    };
  }
};

/**
 * Build a variant of the tool's example values.
 *
 * @param slug  tool slug (falls back to an unchanged copy of the base when the
 *              tool has no variant rule, e.g. weekly-menu-generator).
 * @param base  the admin-provided (or default) example values.
 * @param seed  any integer; the same seed always produces the same variant.
 */
export function buildExampleVariant(
  slug: string,
  base: Record<string, unknown>,
  seed: number
): Record<string, unknown> {
  const rule = RULES[slug];
  if (!rule) return { ...base };
  return { ...base, ...rule(base, makeRng(seed)) };
}
