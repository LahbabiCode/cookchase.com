// Admin-editable "Try an example" configuration for every tool.
//
// Before this module existed, each tool widget hardcoded its own example:
//   - the hint sentence shown next to the "Try an example" button
//     (passed to <ExampleHelper hint={...} />), and
//   - the values that button fills (each widget's own loadExample()).
//
// Now both live in the database (tools.example_hint, tools.example_values as
// JSON) and this module owns:
//   - the default hint + values for the 31 built-in tools, extracted verbatim
//     from the widgets they came from — used to backfill existing databases,
//     seed new installs, and pre-fill the admin editor;
//   - parseToolExampleValues / serializeToolExampleValues, the pure helpers
//     the admin editor and the tool page share.
//
// A widget that finds no admin config (a tool created before this feature, or
// an admin-created tool whose slug has no widget) falls back to the defaults
// it already hardcoded — the feature is fully optional.
//
// This module is PURE (no codebase imports) so node --test can load it.

export interface ToolExampleConfig {
  /** The sentence shown beside "Try an example". */
  hint: string;
  /** Field values the button fills (keys are per-widget; see each widget). */
  values: Record<string, unknown>;
}

/**
 * Default "Try an example" for the 31 built-in tools, extracted verbatim from
 * each widget's loadExample() and its <ExampleHelper hint={...} /> text.
 * Widgets whose example is random or too complex to preset (weekly menu
 * generator, recipe comparator) ship an empty values object — the admin can
 * still customize the hint text.
 */
export const TOOL_EXAMPLES: Record<string, ToolExampleConfig> = {
  "alcohol-cookoff": {
    hint: "See how much alcohol remains after simmering 250 ml of wine for 30 minutes.",
    values: { volume: "250", alcohol: "wine", method: "simmer30" }
  },
  "baking-pan-converter": {
    hint: "Switch a 9-inch round cake recipe to a 9×13 rectangle pan.",
    values: {
      orig: { shape: "round", d: "9", w: "", l: "", unit: "in" },
      target: { shape: "rectangle", d: "", w: "9", l: "13", unit: "in" }
    }
  },
  "bread-hydration": {
    hint: "Build a 70% hydration loaf from 500 g of flour — water, salt and yeast.",
    values: { flour: "500", hydration: 70, saltPct: 2, yeastPct: 1 }
  },
  "brine-calculator": {
    hint: "Brine a 1.5 kg whole chicken overnight in a classic 5% wet brine.",
    values: { weight: "1.5", mode: "wet", saltPct: 5, guide: "chicken" }
  },
  "caffeine-calculator": {
    hint: "Track a coffee-heavy workday — drip, espresso, tea and cola.",
    values: {
      rows: [
        { type: "drip", ml: "240" },
        { type: "espresso", ml: "60" },
        { type: "blackTea", ml: "300" },
        { type: "cola", ml: "330" }
      ]
    }
  },
  "coffee-espresso-calculator": {
    hint: "Dial in 20 g of coffee with 320 ml of water for a pour-over.",
    values: { method: "pour-over", coffee: "20", water: "320", shots: "1", espressoStyle: "normale" }
  },
  "dough-batch-converter": {
    hint: "Scale a dough formula up to a 1.2 kg batch at 72% hydration.",
    values: { target: "1200", hydration: "72", saltPct: "2.1", flourSplit: "20" }
  },
  "egg-timer": {
    hint: "Set a jammy medium-boiled egg — 8 minutes at sea level.",
    values: { styleId: "medium", altitude: "0" }
  },
  "food-shelf-life": {
    hint: "Check how long raw chicken lasts in the fridge — today's date, today's answer.",
    values: { foodId: "raw-chicken", storage: "fridge" }
  },
  "food-storage-guide": {
    hint: "Search how long chicken, milk or rice keeps — pantry, fridge and freezer.",
    values: { query: "chicken" }
  },
  "frying-temperature": {
    hint: "Fry chicken at 350°F — see the Celsius setting and 11 more foods.",
    values: { f: "350", c: "176.7" }
  },
  "grams-cups-converter": {
    hint: "Convert 1 cup of honey to grams — honey weighs more than flour.",
    values: { ingredient: "Honey", direction: "volume-to-weight", amount: "1", unit: "cup", grams: "340" }
  },
  "ingredient-substitution": {
    hint: "Find a swap for eggs when you're out — flax, applesauce or banana.",
    values: { query: "egg", selected: "egg" }
  },
  "kitchen-timers": {
    hint: "Run pasta, roast chicken and broccoli timers all at once.",
    values: {
      timers: [
        { name: "Pasta", duration: 600 },
        { name: "Roast chicken", duration: 2700 },
        { name: "Steamed broccoli", duration: 300 }
      ]
    }
  },
  "meal-prep-planner": {
    hint: "Press Generate plan with a 2,000 kcal goal to see a full balanced week appear below.",
    values: { days: 5, calGoal: 2000, budget: 30 }
  },
  "measurement-to-weight": {
    hint: "Rewrite a cup-based baking recipe in grams — flour, sugar, butter and more.",
    values: {
      rows: [
        { ingredient: "All-purpose flour", amount: "2", unit: "cup" },
        { ingredient: "Granulated sugar", amount: "0.5", unit: "cup" },
        { ingredient: "Butter (melted)", amount: "8", unit: "tbsp" },
        { ingredient: "Milk (whole)", amount: "1", unit: "cup" },
        { ingredient: "Honey", amount: "3", unit: "tbsp" }
      ]
    }
  },
  "meat-cooking-time": {
    hint: "Roast a 1.5 kg whole chicken and get its exact cook time and target temp.",
    values: { meat: "chickenWhole", weight: "1.5" }
  },
  "meat-doneness-guide": {
    hint: "Check the target temperature for a medium-rare steak — 135°F / 57°C.",
    values: { meatId: "beef-steak", donenessId: "med-rare" }
  },
  "nutrition-calculator": {
    hint: "Count calories for a chicken, rice & broccoli dinner in 4 servings.",
    values: {
      servings: "4",
      rows: [
        { food: "Chicken breast (raw)", grams: "600" },
        { food: "White rice (dry)", grams: "200" },
        { food: "Broccoli", grams: "300" },
        { food: "Olive oil", grams: "15" }
      ]
    }
  },
  "pizza-dough-calculator": {
    hint: "Make 2 Neapolitan pizzas with 280 g dough balls at 65% hydration.",
    values: { pizzas: "2", ballWeight: "280", hydration: 65, yeastPct: 0.3 }
  },
  "pressure-cooker-converter": {
    hint: "Cook 1.5 kg of pork shoulder for pulled pork — 60 min at high pressure.",
    values: { food: "porkShoulder", weight: "1500" }
  },
  "recipe-comparator": {
    hint: "Compare a garlic chicken & rice dinner, beef tacos and a veggie stir-fry — time, cost & nutrition.",
    values: {}
  },
  "recipe-cost-calculator": {
    hint: "Price a spaghetti bolognese for 4 people — ingredient costs included.",
    values: {
      servings: "4",
      rows: [
        { name: "Spaghetti", amount: "400", price: "1.5", packageSize: "500" },
        { name: "Ground beef", amount: "500", price: "6", packageSize: "500" },
        { name: "Tomato passata", amount: "700", price: "2", packageSize: "700" },
        { name: "Onion", amount: "150", price: "0.5", packageSize: "150" },
        { name: "Parmesan", amount: "50", price: "4", packageSize: "200" }
      ]
    }
  },
  "recipe-scaler": {
    hint: "Scale a birthday cake — change servings from 6 to 12 and every ingredient updates.",
    values: {
      original: "6",
      desired: "12",
      rows: [
        { name: "Flour", amount: "300", unit: "g" },
        { name: "Sugar", amount: "200", unit: "g" },
        { name: "Butter", amount: "150", unit: "g" },
        { name: "Eggs", amount: "3", unit: "piece" },
        { name: "Milk", amount: "240", unit: "ml" },
        { name: "Baking powder", amount: "2", unit: "tsp" }
      ]
    }
  },
  "sourdough-calculator": {
    hint: "Feed 80 g of starter up to 300 g at a standard 1:2:2 ratio.",
    values: { current: "80", target: "300", ratio: 2 }
  },
  "sous-vide-guide": {
    hint: "Cook a thick steak to medium-rare — water temperature and time.",
    values: { protein: "steak", idx: 1 }
  },
  "sweetener-converter": {
    hint: "Swap 100 g of sugar for honey in a muffin recipe.",
    values: { sugar: "100", sweetener: "honey" }
  },
  "temperature-converter": {
    hint: "Set 350°F and see the Celsius, gas-mark and fan-oven equivalents.",
    values: { mode: "f", value: "350" }
  },
  "unit-converter": {
    hint: "Convert 2 cups of milk to milliliters — see the result instantly.",
    values: { category: "volume", amount: "2", from: "cup", to: "ml" }
  },
  "water-intake": {
    hint: "Calculate how much water a 70 kg adult needs on an active day.",
    values: { weight: "70", unit: "kg", activity: 45, climate: "mild" }
  },
  "weekly-menu-generator": {
    hint: "Generate a fresh 7-night dinner plan — no two nights share a protein.",
    values: {}
  }
};

/**
 * Parse a tools.example_values column (JSON string) into a values object.
 * Anything that isn't a JSON object falls back to {} so a corrupt value never
 * crashes the tool page or the editor.
 */
export function parseToolExampleValues(
  raw: string | null | undefined
): Record<string, unknown> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

/** Serialize a values object back to the column format. */
export function serializeToolExampleValues(
  values: Record<string, unknown>
): string {
  return JSON.stringify(values);
}

/** The default example config for a built-in tool, or a blank one. */
export function defaultToolExample(slug: string): ToolExampleConfig {
  return TOOL_EXAMPLES[slug] ?? { hint: "", values: {} };
}
