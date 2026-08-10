import { test } from "node:test";
import assert from "node:assert/strict";
import { fact, interpolate, buildDynamicFaq, ALL_FAQS } from "../lib/tool-faq.ts";
import type { ToolFacts } from "../components/tools/faqStore.ts";

function facts(obj: Record<string, string>): ToolFacts {
  const out: ToolFacts = {};
  for (const [k, v] of Object.entries(obj)) out[k] = { label: k, value: v };
  return out;
}

// --- interpolate -----------------------------------------------------------

test("interpolate fills {key} placeholders from facts", () => {
  const f = facts({ servings: "4", kcal: "350 kcal" });
  assert.equal(interpolate("With {servings} servings, each is {kcal}.", f),
    "With 4 servings, each is 350 kcal.");
});

test("interpolate leaves unknown placeholders untouched", () => {
  const f = facts({ servings: "4" });
  assert.equal(interpolate("Need {weight} of flour", f), "Need {weight} of flour");
});

test("interpolate handles repeated and adjacent placeholders", () => {
  const f = facts({ a: "x", b: "y" });
  assert.equal(interpolate("{a} and {a} then {b}{b}", f), "x and x then yy");
});

test("fact returns empty string for a missing key", () => {
  assert.equal(fact(facts({ a: "1" }), "missing"), "");
});

// --- buildDynamicFaq --------------------------------------------------------

test("buildDynamicFaq returns nothing for an unknown slug", () => {
  assert.deepEqual(buildDynamicFaq("does-not-exist", facts({})), []);
});

test("buildDynamicFaq skips items whose when predicate fails", () => {
  // recipe-scaler's scaling-up question only appears above 1.5×
  const f = facts({ factor: "1.25", servingsFrom: "4", servingsTo: "5" });
  const items = buildDynamicFaq("recipe-scaler", f);
  assert.equal(items.some((i) => i.q.includes("baking powder")), false);

  const big = facts({ factor: "2×", servingsFrom: "4", servingsTo: "8" });
  const bigItems = buildDynamicFaq("recipe-scaler", big);
  assert.equal(bigItems.some((i) => i.q.includes("baking powder")), true);
});

test("recipe-scaler answers speak in terms of the entered servings", () => {
  const f = facts({
    servingsFrom: "4",
    servingsTo: "8",
    factor: "2×",
    ing1Name: "Flour",
    ing1Scaled: "500 g",
    ing1Unit: "g",
    ing1Orig: "250"
  });
  const items = buildDynamicFaq("recipe-scaler", f);
  assert.ok(items.length >= 2);
  const scale = items.find((i) => i.q.includes("scale factor"));
  assert.ok(scale, "expected the scale-factor question");
  assert.ok(scale.a.includes("2×"), "answer mentions the factor");
  assert.ok(scale.a.includes("8 servings"), "answer mentions the target servings");
  const ing = items.find((i) => i.q.includes("Flour"));
  assert.ok(ing, "expected the ingredient question");
  assert.ok(ing.a.includes("500 g"), "answer mentions the scaled amount");
});

test("temperature-converter answers update with the unit", () => {
  const f = facts({
    value: "350",
    mode: "F",
    c: "176.7 °C",
    f: "350 °F",
    gas: "Mark 4",
    fan: "150 °C"
  });
  const items = buildDynamicFaq("temperature-converter", f);
  assert.ok(items.some((i) => i.q.includes("350°F")));
  const gas = items.find((i) => i.q.includes("gas mark"));
  assert.ok(gas && gas.a.includes("Mark 4"));
});

test("water-intake question uses the entered weight and unit", () => {
  const f = facts({
    weight: "70",
    unit: "kg",
    total: "2850 ml",
    cups: "12 cups (240 ml)",
    exercise: "45 min",
    exerciseExtra: "+350 ml"
  });
  const items = buildDynamicFaq("water-intake", f);
  const q = items.find((i) => i.q.includes("70 kg"));
  assert.ok(q, "question should reference the entered weight");
  assert.ok(q.a.includes("2850 ml"));
});

test("conditional caffeine question only appears above 400 mg", () => {
  const under = facts({ drinks: "2", total: "350 mg", status: "within the FDA guideline" });
  assert.equal(
    buildDynamicFaq("caffeine-calculator", under).some((i) => i.q.includes("over 400 mg")),
    false
  );
  const over = facts({ drinks: "4", total: "520 mg", status: "above the FDA guideline" });
  assert.equal(
    buildDynamicFaq("caffeine-calculator", over).some((i) => i.q.includes("over 400 mg")),
    true
  );
});

test("frying-temperature questions react to the entered temperature", () => {
  const hot = facts({ f: "400°F", c: "204°C", verdict: "hot enough to burn the outside" });
  const items = buildDynamicFaq("frying-temperature", hot);
  assert.ok(items.some((i) => i.q.includes("400°F")));
  assert.ok(
    buildDynamicFaq("frying-temperature", hot).some((i) => i.q.includes("too hot")),
    "over 385°F should surface the too-hot question"
  );
  const cold = facts({ f: "300°F", c: "149°C", verdict: "too cool for a crisp crust" });
  assert.ok(
    buildDynamicFaq("frying-temperature", cold).some((i) => i.q.includes("too cool")),
    "under 330°F should surface the too-cool question"
  );
});

test("meal-prep-planner references the budget and day count", () => {
  const f = facts({
    days: "5",
    calGoal: "2000 kcal/day",
    budget: "$30",
    mealsCount: "10",
    kcalPerDay: "2000 kcal"
  });
  const items = buildDynamicFaq("meal-prep-planner", f);
  assert.ok(items.some((i) => i.a.includes("5 day")));
  assert.ok(items.some((i) => i.q.includes("$30")));
});

// Fact keys each widget actually publishes via usePublishToolFacts — the
// contract the definitions must match. If a definition references a key the
// widget never publishes, the question is silently dropped (or, worse, shows
// with an unfilled placeholder), so this test pins the keys down.
const PUBLISHED_KEYS: Record<string, string[]> = {
  "recipe-scaler": ["servingsFrom", "servingsTo", "factor", "ing1Name", "ing1Scaled", "ing1Unit", "ing1Orig"],
  "unit-converter": ["amount", "from", "to", "result", "category"],
  "temperature-converter": ["value", "mode", "f", "c", "gas", "fan"],
  "recipe-cost-calculator": ["servings", "total", "perServing", "estCount", "rowCount"],
  "meat-cooking-time": ["meat", "weightKg", "timeMin", "timeMax", "temp"],
  "baking-pan-converter": ["origPan", "targetPan", "factor", "origArea", "targetArea"],
  "nutrition-calculator": ["servings", "kcalTotal", "kcalPer", "proteinPer", "carbsPer", "fatPer"],
  "ingredient-substitution": ["selected", "topSub", "topRatio"],
  "meal-prep-planner": ["days", "calGoal", "budget", "mealsCount", "kcalPerDay"],
  "kitchen-timers": ["count", "active"],
  "sous-vide-guide": ["protein", "doneness", "tempC", "tempF", "timeMin"],
  "pizza-dough-calculator": ["pizzas", "ballWeight", "hydration", "flour", "water", "salt", "yeast", "total", "texture"],
  "sweetener-converter": ["sugar", "sweetener", "equivalent", "unit", "liquidAdjust"],
  "bread-hydration": ["flour", "hydration", "water", "salt", "total", "feel"],
  "sourdough-calculator": ["current", "target", "ratio", "flour", "water", "discard"],
  "brine-calculator": ["weight", "mode", "salt", "water", "time", "guide"],
  "food-storage-guide": ["food", "pantry", "fridge", "freezer", "note"],
  "caffeine-calculator": ["drinks", "total", "status"],
  "alcohol-cookoff": ["volume", "alcohol", "method", "remaining", "retention"],
  "water-intake": ["weight", "unit", "exercise", "climate", "total", "cups", "exerciseExtra"],
  "pressure-cooker-converter": ["food", "weight", "minutes", "release"],
  "weekly-menu-generator": ["count", "batch", "quick"],
  "dough-batch-converter": ["target", "hydration", "flour", "water", "salt"],
  "frying-temperature": ["f", "c", "verdict"],
  "egg-timer": ["style", "minutes", "altitude"],
  "recipe-comparator": ["count", "summary", "cheapest", "fastest"],
  "coffee-espresso-calculator": ["method", "coffee", "water", "ratio", "strength", "recMin", "recMax", "targetWater", "style", "shots", "yield", "totalYield"],
  "grams-cups-converter": ["ingredient", "density", "amount", "unit", "grams", "direction"],
  "meat-doneness-guide": ["meat", "doneness", "tempF", "tempC", "safeMinF", "rest"],
  "food-shelf-life": ["food", "storage", "days", "expiry", "remaining", "status", "freezerDays"],
  "measurement-to-weight": ["count", "total", "totalKg", "top"]
};

/** Every {key} placeholder in a definition must be a key the widget publishes. */
test("every definition placeholder resolves to a published fact key", () => {
  for (const [slug, defs] of Object.entries(ALL_FAQS)) {
    const published = new Set(PUBLISHED_KEYS[slug] ?? []);
    for (const item of defs) {
      for (const template of [item.q, typeof item.a === "string" ? item.a : ""]) {
        const m = template.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
        for (const ph of m) {
          const key = ph.slice(1, -1);
          assert.ok(published.has(key), `${slug}: placeholder {${key}} is not published`);
        }
      }
    }
  }
});

test("all 31 tools have at least one definition", () => {
  const slugs = [
    "recipe-scaler", "unit-converter", "temperature-converter", "recipe-cost-calculator",
    "meat-cooking-time", "baking-pan-converter", "nutrition-calculator",
    "ingredient-substitution", "meal-prep-planner", "kitchen-timers", "sous-vide-guide",
    "pizza-dough-calculator", "sweetener-converter", "bread-hydration",
    "sourdough-calculator", "brine-calculator", "food-storage-guide",
    "caffeine-calculator", "alcohol-cookoff", "water-intake", "pressure-cooker-converter",
    "weekly-menu-generator", "dough-batch-converter", "frying-temperature", "egg-timer",
    "recipe-comparator", "coffee-espresso-calculator", "grams-cups-converter",
    "meat-doneness-guide", "food-shelf-life", "measurement-to-weight"
  ];
  assert.equal(slugs.length, 31);
  for (const s of slugs) {
    assert.ok(Array.isArray(ALL_FAQS[s]), `missing FAQ definition for ${s}`);
    assert.ok(ALL_FAQS[s].length >= 2, `${s} should have at least 2 questions`);
  }
});
