import { test } from "node:test";
import assert from "node:assert/strict";
import { buildExampleVariant, makeRng } from "../lib/example-variants.ts";

const BASE: Record<string, Record<string, unknown>> = {
  "water-intake": { weight: "70", unit: "kg", activity: 45, climate: "mild" },
  "recipe-scaler": { original: "6", desired: "12" },
  "unit-converter": { category: "volume", amount: "2", from: "cup", to: "ml" },
  "sous-vide-guide": { protein: "steak", idx: 1 },
  "meat-doneness-guide": { meatId: "beef-steak", donenessId: "med-rare" },
  "kitchen-timers": { timers: [{ name: "Pasta", duration: 600 }] },
  "nutrition-calculator": { servings: "4", rows: [{ food: "Chicken breast (raw)", grams: "600" }] },
  "grams-cups-converter": {
    ingredient: "Honey",
    direction: "volume-to-weight",
    amount: "1",
    unit: "cup",
    grams: "340"
  },
  "weekly-menu-generator": {},
  "no-such-tool": { weight: "70" }
};

test("buildExampleVariant is deterministic for the same seed", () => {
  for (const slug of Object.keys(BASE)) {
    const a = buildExampleVariant(slug, BASE[slug], 7);
    const b = buildExampleVariant(slug, BASE[slug], 7);
    assert.deepEqual(a, b, `${slug} must be reproducible for the same seed`);
  }
});

test("different seeds produce different examples for jitterable tools", () => {
  // Water intake has a 50–95 kg range at 5 kg steps — 10 possible values, so
  // seeds 1..12 should collide rarely; require at least two distinct values.
  const weights = new Set<number>();
  for (let seed = 1; seed <= 12; seed++) {
    const v = buildExampleVariant("water-intake", BASE["water-intake"], seed);
    weights.add(Number(v.weight));
  }
  assert.ok(weights.size >= 2, `expected varied weights, got ${Array.from(weights).join(", ")}`);

  // Sous-vide: the protein should rotate across presses.
  const proteins = new Set<string>();
  for (let seed = 1; seed <= 10; seed++) {
    const v = buildExampleVariant("sous-vide-guide", BASE["sous-vide-guide"], seed);
    proteins.add(String(v.protein));
  }
  assert.ok(proteins.size >= 2, `expected varied proteins, got ${Array.from(proteins).join(", ")}`);
});

test("water-intake values stay inside the widget's valid bounds", () => {
  for (let seed = 1; seed <= 100; seed++) {
    const v = buildExampleVariant("water-intake", BASE["water-intake"], seed);
    const weight = Number(v.weight);
    assert.ok(weight >= 50 && weight <= 95, `weight ${weight} out of 50–95`);
    assert.equal(weight % 5, 0, `weight ${weight} not on a 5 kg step`);
    assert.ok(Number(v.activity) >= 15 && Number(v.activity) <= 120, "activity out of range");
    assert.equal(Number(v.activity) % 15, 0, "activity not on the slider's 15-min step");
    assert.ok(["mild", "hot", "veryHot"].includes(String(v.climate)), `bad climate ${v.climate}`);
    assert.equal(v.unit, "kg", "unit must be preserved from the base");
  }
});

test("unit-converter picks valid from/to pairs within the category", () => {
  for (let seed = 1; seed <= 100; seed++) {
    const v = buildExampleVariant("unit-converter", BASE["unit-converter"], seed);
    assert.ok(["volume", "weight"].includes(String(v.category)), `bad category ${v.category}`);
    const vol = ["cup", "tbsp", "tsp", "fl oz", "ml", "liter"];
    const weight = ["g", "kg", "oz", "lb"];
    const list = v.category === "volume" ? vol : weight;
    assert.ok(list.includes(String(v.from)), `bad from ${v.from}`);
    assert.ok(list.includes(String(v.to)), `bad to ${v.to}`);
    assert.notEqual(v.from, v.to, "from and to must differ");
  }
});

test("sous-vide idx never exceeds the selected protein's option count", () => {
  // steak has 4 options (idx 0–3), chickenThigh has 1 (idx 0 only).
  for (let seed = 1; seed <= 200; seed++) {
    const v = buildExampleVariant("sous-vide-guide", BASE["sous-vide-guide"], seed);
    const max = v.protein === "steak" ? 3 : v.protein === "chickenThigh" ? 0 : 2;
    assert.ok(Number(v.idx) >= 0 && Number(v.idx) <= max, `idx ${v.idx} invalid for ${v.protein}`);
  }
});

test("meat-doneness donenessId is valid for the chosen meat", () => {
  const valid: Record<string, string[]> = {
    "beef-steak": ["rare", "med-rare", "medium", "med-well", "well"],
    "beef-roast": ["med-rare", "medium", "well"],
    pork: ["medium", "well"],
    lamb: ["rare", "med-rare", "medium", "well"],
    chicken: ["breast", "thigh"],
    turkey: ["whole", "breast"],
    fish: ["medium", "flaky"]
  };
  for (let seed = 1; seed <= 100; seed++) {
    const v = buildExampleVariant("meat-doneness-guide", BASE["meat-doneness-guide"], seed);
    assert.ok(valid[String(v.meatId)]?.includes(String(v.donenessId)), `bad pair ${v.meatId}/${v.donenessId}`);
  }
});

test("array tools keep their structure and jitter numeric fields", () => {
  for (let seed = 1; seed <= 50; seed++) {
    const timers = buildExampleVariant("kitchen-timers", BASE["kitchen-timers"], seed);
    const t = timers.timers as { name: string; duration: number }[];
    assert.ok(Array.isArray(t) && t.length === 1, "timers array must be preserved");
    assert.equal(t[0].name, "Pasta", "timer names preserved");
    assert.ok(t[0].duration >= 300 && t[0].duration <= 1200, `duration ${t[0].duration} out of range`);

    const nut = buildExampleVariant("nutrition-calculator", BASE["nutrition-calculator"], seed);
    const rows = nut.rows as { food: string; grams: string }[];
    assert.ok(Array.isArray(rows) && rows.length === 1, "nutrition rows preserved");
    assert.equal(rows[0].food, "Chicken breast (raw)", "food names preserved");
    const g = Number(rows[0].grams);
    assert.ok(g >= 50 && g <= 800, `grams ${g} out of range`);
  }
});

test("tools without a rule (or unknown slugs) return the base unchanged", () => {
  assert.deepEqual(
    buildExampleVariant("weekly-menu-generator", BASE["weekly-menu-generator"], 5),
    {}
  );
  assert.deepEqual(
    buildExampleVariant("no-such-tool", BASE["no-such-tool"], 5),
    { weight: "70" }
  );
});

test("every built-in tool with example values has a variant rule", async () => {
  const { TOOL_EXAMPLES } = await import("../lib/tool-examples.ts");
  const { RULES } = await import("../lib/example-variants.ts");
  // Tools whose example is random/too complex are explicitly excluded.
  const NO_RULE_OK = ["weekly-menu-generator", "recipe-comparator"];
  const missing: string[] = [];
  for (const [slug, cfg] of Object.entries(TOOL_EXAMPLES)) {
    const hasValues = Object.keys(cfg.values ?? {}).length > 0;
    if (hasValues && !(slug in RULES) && !NO_RULE_OK.includes(slug)) {
      missing.push(slug);
    }
  }
  assert.deepEqual(missing, [], `tools missing a variant rule: ${missing.join(", ")}`);
});

test("caffeine rows jitter ml per type while preserving types", () => {
  const base = {
    rows: [
      { type: "drip", ml: "240" },
      { type: "espresso", ml: "60" },
      { type: "blackTea", ml: "300" },
      { type: "cola", ml: "330" }
    ]
  };
  for (let seed = 1; seed <= 50; seed++) {
    const v = buildExampleVariant("caffeine-calculator", base, seed);
    const rows = v.rows as { type: string; ml: string }[];
    assert.ok(Array.isArray(rows) && rows.length === 4, "rows preserved");
    assert.equal(rows[0].type, "drip");
    assert.equal(rows[1].type, "espresso");
    assert.ok(Number(rows[0].ml) >= 180 && Number(rows[0].ml) <= 360, `drip ml ${rows[0].ml} out of range`);
    assert.ok(Number(rows[1].ml) >= 40 && Number(rows[1].ml) <= 90, `espresso ml ${rows[1].ml} out of range`);
    assert.ok(Number(rows[2].ml) >= 200 && Number(rows[2].ml) <= 350, `tea ml ${rows[2].ml} out of range`);
    assert.ok(Number(rows[3].ml) >= 250 && Number(rows[3].ml) <= 400, `cola ml ${rows[3].ml} out of range`);
  }
});

test("makeRng is deterministic and covers the [0,1) range", () => {
  const a = makeRng(42);
  const b = makeRng(42);
  for (let i = 0; i < 10; i++) assert.equal(a(), b());
  const r = makeRng(1);
  const seen = new Set<number>();
  for (let i = 0; i < 200; i++) {
    const x = r();
    assert.ok(x >= 0 && x < 1, `rng out of range: ${x}`);
    seen.add(x);
  }
  assert.ok(seen.size > 100, "rng should produce varied values");
});
