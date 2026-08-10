"use client";

// Per-tool string layer.
//
// The shared dictionary (lib/i18n.ts) covers site chrome and common widget
// labels ("Copy", "Reset", "servings", …). Each individual widget additionally
// has tool-specific strings that only make sense in its context ("Hydration %",
// "Pull temp", "Brining time"). Those live here, keyed by tool slug.
//
// The site is English-only, so every entry is a plain English string.
// useToolStrings(slug) returns a `ts(key, vars)` function that:
//   1. looks up the tool dictionary,
//   2. falls back to the shared dictionary (same chain),
//   3. and finally returns the key itself — a string always renders.

import { useLang } from "./useLang";
import { t } from "./i18n";

export type ToolDict = Record<string, string>;

/**
 * Tool-specific dictionaries, keyed by tool slug. Keys are short and camelCase
 * — e.g. "hydration", "pullTemp" — and never collide with the shared
 * dictionary because the hook checks the tool dictionary first.
 */
export const TOOL_STRINGS: Record<string, ToolDict> = {
  // --- Baking Pan Converter ---
  "baking-pan-converter": {
    panFrom: "Original pan",
    panTo: "New pan",
    shape: "Shape",
    round: "Round",
    square: "Square",
    rectangle: "Rectangle",
    diameter: "Diameter",
    side: "Side length",
    length: "Length",
    width: "Width",
    depth: "Depth",
    multiplier: "Scale multiplier",
    areaFrom: "Original area",
    areaTo: "New area",
    increaseBatter: "Increase batter/ingredients by this multiplier.",
    batterNote:
      "For cakes that rise high, use a pan with similar depth — depth changes baking time more than area does.",
    sameSize: "Same size",
    bigger: "Bigger",
    smaller: "Smaller"
  },

  // --- Bread Hydration ---
  "bread-hydration": {
    flour: "Flour weight",
    water: "Water weight",
    salt: "Salt",
    hydration: "Hydration",
    hydrationHint: "70% hydration means 700 g water per 1000 g flour — a classic country loaf.",
    doughWeight: "Total dough weight",
    waterToAdd: "Water to add",
    flourToAdd: "Flour to add",
    targetHydration: "Target hydration",
    targetWater: "Water weight to reach {pct}%",
    targetFlour: "Flour weight to reach {pct}%",
    wetHint:
      "Above 80% the dough is very sticky — perfect for ciabatta, hard to shape by hand.",
    dryHint: "Below 60% the dough is firm — great for bagels and stiff sandwich loaves."
  },

  // --- Brine Calculator ---
  "brine-calculator": {
    waterVolume: "Water volume",
    brineType: "Brine type",
    wet: "Wet brine",
    dry: "Dry brine",
    meatWeight: "Meat weight",
    saltNeeded: "Salt needed",
    sugarNeeded: "Sugar needed",
    totalBrine: "Total brine volume",
    percent: "Brine strength",
    classic: "Classic (5%)",
    light: "Light (3.5%)",
    strong: "Strong (7%)",
    custom: "Custom",
    saltPerLiter: "Salt per liter",
    timeHint:
      "Rule of thumb: brine 30–60 minutes per 450 g of meat, 24 hours max for chicken."
  },

  // --- Caffeine Calculator ---
  "caffeine-calculator": {
    drink: "Drink",
    size: "Size",
    addDrink: "Add drink",
    totalCaffeine: "Total caffeine",
    dailyTarget: "Daily guideline",
    underLimit: "Within the 400 mg guideline for healthy adults.",
    overLimit: "Above the 400 mg guideline — consider a decaf or a smaller cup.",
    mg: "mg",
    lastCutoff: "For better sleep, stop caffeine about 8 hours before bedtime."
  },

  // --- Coffee / Espresso ---
  "coffee-espresso-calculator": {
    method: "Brew method",
    coffee: "Coffee",
    water: "Water",
    ratio: "Ratio",
    dose: "Dose",
    yield: "Yield",
    shot: "Shot type",
    ristretto: "Ristretto (1:1.5)",
    normale: "Normale (1:2)",
    lungo: "Lungo (1:3)",
    pourOver: "Pour-over / drip",
    frenchPress: "French press",
    aeropress: "AeroPress",
    moka: "Moka pot",
    waterToAdd: "Water to add",
    doseHint: "For espresso: grind fine, 18 g in a double basket."
  },

  // --- Dough Batch Converter ---
  "dough-batch-converter": {
    originalWeight: "Original dough weight",
    batchSize: "Batch size",
    portions: "Portions",
    loafWeight: "Per-piece weight",
    newBatch: "New batch total",
    factor: "Scaling factor",
    scaledFlour: "Scaled flour",
    scaledWater: "Scaled water",
    scaledSalt: "Scaled salt",
    scaledYeast: "Scaled yeast"
  },

  // --- Egg Timer ---
  "egg-timer": {
    style: "Egg style",
    soft: "Soft (runny yolk)",
    medium: "Medium (jammy)",
    hard: "Hard (fully set)",
    start: "Start timer",
    stop: "Stop",
    reset: "Reset",
    timeLeft: "Time left",
    done: "Eggs are done!",
    iceBath: "Ice-bath 30 seconds, then tap and roll to peel."
  },

  // --- Food Shelf Life ---
  "food-shelf-life": {
    food: "Food",
    category: "Category",
    pantry: "Pantry",
    fridge: "Fridge",
    freezer: "Freezer",
    shelfLife: "Shelf life",
    signs: "Signs it's past it",
    tip: "Storage tip",
    pantryLabel: "In the pantry",
    fridgeLabel: "In the fridge",
    freezerLabel: "In the freezer",
    roomTempRule: "2-hour rule"
  },

  // --- Food Storage Guide ---
  "food-storage-guide": {
    food: "Food item",
    storage: "Storage method",
    duration: "How long it lasts",
    bestMethod: "Best way to store",
    avoid: "Avoid",
    check: "Check for",
    fridge: "Fridge",
    freezer: "Freezer",
    counter: "Counter"
  },

  // --- Frying Temperature ---
  "frying-temperature": {
    food: "What are you frying?",
    oil: "Oil type",
    temp: "Oil temperature",
    smokePoint: "Smoke point",
    tooLow: "Below 325°F the food soaks up oil.",
    tooHigh: "Above 400°F it browns before cooking through.",
    readyTest: "Test: a wooden spoon handle bubbles steadily in the oil.",
    fahrenheit: "°F",
    celsius: "°C"
  },

  // --- Grams ↔ Cups Converter ---
  "grams-cups-converter": {
    ingredient: "Ingredient",
    gramsToCups: "Grams → cups",
    cupsToGrams: "Cups → grams",
    grams: "Grams",
    cups: "Cups",
    density: "Density",
    gramsPerCup: "grams per cup",
    result: "Conversion",
    commonIngredients: "Common ingredients",
    note:
      "A 'cup' can weigh differently depending on how you scoop — these are standard spoon-and-level values."
  },

  // --- Ingredient Substitution ---
  "ingredient-substitution": {
    ingredient: "Ingredient you're missing",
    swap: "Best substitutes",
    amount: "Amount needed",
    ratio: "Use this much",
    note: "Cooking note",
    swapN: "Swap {n}"
  },

  // --- Kitchen Timers ---
  "kitchen-timers": {
    addTimer: "Add timer",
    label: "Label (optional)",
    minutes: "Minutes",
    start: "Start",
    pause: "Pause",
    resume: "Resume",
    reset: "Reset",
    done: "Time's up!",
    ringNote: "Play a sound when each timer finishes.",
    presets: "Quick presets"
  },

  // --- Meal Prep Planner ---
  "meal-prep-planner": {
    meals: "Meals for the week",
    addMeal: "Add meal",
    mealName: "Meal name",
    ingredients: "Ingredients",
    shoppingList: "Combined shopping list",
    groupProduce: "Produce",
    groupDairy: "Dairy",
    groupPantry: "Pantry",
    groupProtein: "Protein",
    groupOther: "Other",
    makeAhead: "Make-ahead friendly",
    freshOnly: "Best made fresh",
    generatePlan: "Generate plan",
    generating: "Building your week…",
    planReady: "Your week is ready",
    emptyPlan: "Add 3–7 meals, then generate a balanced week with no repeated proteins."
  },

  // --- Measurement → Weight ---
  "measurement-to-weight": {
    ingredient: "Ingredient",
    measurement: "Measurement",
    weight: "Weight",
    convert: "Convert to weight",
    cups: "Cups",
    tablespoons: "Tablespoons",
    teaspoons: "Teaspoons",
    grams: "Grams",
    ounces: "Ounces",
    result: "Weight",
    note:
      "Weighing is the only way to be truly consistent — a cup scooped can differ by 20%."
  },

  // --- Meat Cooking Time ---
  "meat-cooking-time": {
    meat: "Cut",
    weight: "Weight",
    method: "Cooking method",
    roast: "Roast",
    grill: "Grill",
    braise: "Braise",
    doneness: "Doneness",
    time: "Estimated time",
    restTime: "Rest time",
    pullTemp: "Pull at",
    targetTemp: "Safe internal temp",
    carryover: "Carryover cooking adds a few more degrees while it rests."
  },

  // --- Meat Doneness Guide ---
  "meat-doneness-guide": {
    meat: "Type of meat",
    doneness: "Doneness",
    temp: "Internal temperature",
    visual: "What to expect",
    rare: "Rare",
    mediumRare: "Medium-rare",
    medium: "Medium",
    mediumWell: "Medium-well",
    wellDone: "Well done",
    safeNote: "Always rest meat 5–10 minutes — carryover raises it 2–4°C."
  },

  // --- Nutrition Calculator ---
  "nutrition-calculator": {
    ingredient: "Ingredient",
    amount: "Amount",
    addIngredient: "Add ingredient",
    servings: "Servings",
    perRecipe: "Per whole recipe",
    perServing: "Per serving",
    estimateNote:
      "Estimates based on USDA standard values — within ~15% for whole ingredients."
  },

  // --- Pizza Dough ---
  "pizza-dough-calculator": {
    pizzas: "Number of pizzas",
    size: "Pizza size",
    style: "Style",
    neapolitan: "Neapolitan",
    newYork: "New York",
    pan: "Pan / sheet",
    flour: "Flour",
    water: "Water",
    yeast: "Yeast",
    salt: "Salt",
    totalDough: "Total dough",
    perBall: "Per dough ball",
    coldFerment: "Cold ferment 24–72 h for best flavor."
  },

  // --- Pressure Cooker ---
  "pressure-cooker-converter": {
    food: "Food",
    size: "Cut size",
    time: "Pressure time",
    naturalRelease: "Natural release",
    quickRelease: "Quick release",
    liquid: "Minimum liquid",
    note: "Always use at least 1 cup of liquid."
  },

  // --- Alcohol Cook-off ---
  "alcohol-cookoff": {
    dish: "Dish / cooking method",
    cookingTime: "Cooking time",
    alcoholLeft: "Alcohol remaining",
    flambe: "Flambe (lit match)",
    baked30: "Baked 30 min",
    simmered30: "Simmered 30 min",
    simmered2h: "Simmered 2+ hours",
    noCook: "No heat, stirred in",
    note: "Alcohol never fully disappears — expect 5–25% to remain depending on method."
  },

  // --- Recipe Comparator ---
  "recipe-comparator": {
    recipe1: "Recipe 1",
    recipe2: "Recipe 2",
    recipe3: "Recipe 3",
    prepTime: "Prep time",
    cookTime: "Cook time",
    servings: "Servings",
    cost: "Estimated cost",
    calories: "Calories per serving",
    addRecipe: "Add recipe",
    shareComparison: "Share this comparison",
    copiedLink: "Comparison link copied!",
    exportPdf: "Export PDF",
    clear: "Clear all",
    summary: "At a glance",
    winner: "Faster",
    cheapest: "Cheapest",
    lighter: "Lightest"
  },

  // --- Recipe Cost Calculator ---
  "recipe-cost-calculator": {
    ingredient: "Ingredient",
    packagePrice: "Package price",
    packageSize: "Package size",
    amountUsed: "Amount used",
    addIngredient: "Add ingredient",
    unitCost: "Unit cost",
    ingredientCost: "Ingredient cost",
    totalCost: "Total cost",
    costPerServing: "Cost per serving",
    servings: "Servings",
    usePriceLib: "Fill from price library"
  },

  // --- Recipe Scaler ---
  "recipe-scaler": {
    servingsFrom: "Original servings",
    servingsTo: "Desired servings",
    ingredient: "Ingredient",
    amount: "Amount",
    unit: "Unit",
    addIngredient: "Add ingredient",
    scaleNote: "For baking, weigh ingredients — and ease off leavening, salt & spices."
  },

  // --- Sourdough ---
  "sourdough-calculator": {
    starter: "Starter amount",
    hydration: "Starter hydration",
    flour: "Flour",
    water: "Water",
    salt: "Salt",
    total: "Total dough",
    note: "Starter counts toward flour & water — the tool accounts for it."
  },

  // --- Sous-vide Guide ---
  "sous-vide-guide": {
    food: "Food",
    doneness: "Doneness",
    temp: "Sous-vide temperature",
    time: "Cook time range",
    finish: "Finishing",
    finishNote: "Sear 30–60 s per side in a ripping-hot pan for a golden crust.",
    safetyNote: "For food safety, cook above 54°C and follow the time range for your cut."
  },

  // --- Sweetener Converter ---
  "sweetener-converter": {
    sugarAmount: "Sugar amount",
    from: "Sugar type",
    to: "Sweetener",
    swap: "Amount to use",
    reduceLiquid: "Reduce liquid",
    reduceLiquidNote:
      "Liquid sweeteners add moisture — reduce other liquids by about 3 tbsp per cup swapped.",
    sweetness: "Relative sweetness",
    granulated: "Granulated sugar",
    brown: "Brown sugar",
    honey: "Honey",
    maple: "Maple syrup",
    stevia: "Stevia",
    erythritol: "Erythritol"
  },

  // --- Temperature Converter ---
  "temperature-converter": {
    value: "Temperature",
    from: "From",
    to: "To",
    celsius: "Celsius",
    fahrenheit: "Fahrenheit",
    kelvin: "Kelvin",
    result: "Converted temperature",
    gasMark: "Gas mark",
    fanOven: "Fan oven",
    note: "Fan ovens run about 20°C cooler — reduce your oven temp by 20°C."
  },

  // --- Unit Converter ---
  "unit-converter": {
    category: "Category",
    from: "From",
    to: "To",
    amount: "Amount",
    result: "Result",
    volume: "Volume",
    weight: "Weight",
    temperature: "Temperature"
  },

  // --- Water Intake ---
  "water-intake": {
    bodyWeight: "Body weight",
    unit: "Weight unit",
    climate: "Climate",
    mild: "Mild",
    hot: "Hot",
    veryHot: "Very hot",
    exercise: "Daily exercise",
    exerciseHint: "Minutes of moderate activity",
    target: "Daily water target",
    total: "Total",
    inLiters: "In liters",
    inCups: "In cups",
    baseline: "Baseline (weight)",
    exerciseBonus: "Exercise bonus",
    climateBonus: "Climate bonus",
    check: "Check:",
    checkNote:
      "pale-straw urine means you're on track. Heavy sweating (not just hot weather) needs extra electrolytes too."
  },

  // --- Weekly Menu Generator ---
  "weekly-menu-generator": {
    days: "Days",
    generate: "Generate week",
    regenerating: "Generating…",
    noRepeat: "No protein repeats on consecutive days",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    dayN: "Day {n}",
    swap: "Swap",
    locked: "Locked"
  }
};

/**
 * Resolve a tool-specific key. `slug` selects the tool dictionary; falls back
 * through the shared dictionary, then the key itself.
 */
export function toolT(
  _lang: "en",
  slug: string,
  key: string,
  vars?: Record<string, string | number>
): string {
  const dict = TOOL_STRINGS[slug];
  const entry = dict?.[key];
  let out: string;
  if (entry) {
    out = entry;
  } else {
    // Fall back to the shared dictionary (e.g. widget.copy, widget.servings).
    out = t(_lang, key, vars);
  }
  if (vars && (entry || dict)) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
  }
  return out;
}

/**
 * React hook returning a `ts(key, vars)` function bound to the current tool
 * slug. Use inside each tool widget:
 *
 *   const ts = useToolStrings("water-intake");
 *   <Field label={ts("bodyWeight")} />
 */
export function useToolStrings(slug: string) {
  const { lang } = useLang();
  return (key: string, vars?: Record<string, string | number>) =>
    toolT(lang, slug, key, vars);
}

/** All slugs that have a tool dictionary — used by tests/editor tooling. */
export function toolStringSlugs(): string[] {
  return Object.keys(TOOL_STRINGS);
}

/** Every tool dictionary key (slug.key) — used by tests/editor tooling. */
export function toolStringKeys(): string[] {
  const out: string[] = [];
  for (const [slug, dict] of Object.entries(TOOL_STRINGS)) {
    for (const key of Object.keys(dict)) out.push(`${slug}.${key}`);
  }
  return out;
}
