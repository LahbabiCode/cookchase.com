// Admin-editable 3-step "Quick guide" for every tool.
//
// Before this module existed, each tool widget hardcoded its own <QuickGuide>
// steps in code. Now the steps live in the database (tools.quick_guide, a
// JSON array of { title, text, example }) and this module owns:
//   - the default steps for the 31 built-in tools (extracted verbatim from
//     the widgets they replaced), used to backfill existing databases and to
//     seed new installs;
//   - parseQuickGuide / serializeQuickGuide — the tiny pure helpers the
//     admin editor and the tool page share.
//
// The optional `example` field is a one-line numeric example shown in small
// gray text inside each guide card ("2 cups flour → 250 g"), so a visitor
// sees a real output before touching the tool. It's admin-editable but not
// required (title + text are).
//
// This module is PURE (no codebase imports) so node --test can load it.

export interface QuickGuideStep {
  title: string;
  text: string;
  /** One-line numeric example ("70 kg → 2,450 ml"), optional. */
  example?: string;
}

/** The 3-step guide shipped with each built-in tool (widgets used to own these). */
export const QUICK_GUIDES: Record<string, QuickGuideStep[]> = {
  "alcohol-cookoff": [
    { title: "Pick the method", text: "Simmer, bake, flambé…", example: "Simmer 30 min → ~10% left" },
    { title: "Enter the alcohol", text: "How much you add and for how long.", example: "250 ml wine → 25 g alcohol" },
    { title: "Get % remaining", text: "How much alcohol is left — or none.", example: "Bake 15 min → ~40% remains" }
  ],
  "baking-pan-converter": [
    { title: "Pick original pan", text: "The shape and size your recipe uses.", example: "9″ round → 9×13 pan" },
    { title: "Pick new pan", text: "What you actually want to bake in.", example: "9″ round → 8″ square ×0.79" },
    { title: "Get the factor", text: "Exactly how to adjust every amount.", example: "×1.27 → multiply every amount" }
  ],
  "bread-hydration": [
    { title: "Enter flour weight", text: "How much flour your recipe uses.", example: "500 g flour at 70%" },
    { title: "Set hydration %", text: "How wet you want the dough.", example: "70% → 350 g water" },
    { title: "Get exact water", text: "Water, salt and total dough weight.", example: "500 g flour → 885 g dough" }
  ],
  "brine-calculator": [
    { title: "Enter meat weight", text: "How much you're brining.", example: "1.5 kg chicken overnight" },
    { title: "Pick the style", text: "Classic wet, dry or quick brine.", example: "5% wet brine → 75 g salt" },
    { title: "Get amounts & time", text: "Water, salt and how long to brine.", example: "1.5 kg → 2 L water + 75 g salt" }
  ],
  "caffeine-calculator": [
    { title: "Add your drinks", text: "Coffee, tea, cola, energy drinks…", example: "3 drinks → 320 mg total" },
    { title: "Set cups & times", text: "When you had them during the day.", example: "Espresso ×2 → 126 mg" },
    { title: "Get the total", text: "Daily caffeine and a safe-limit check.", example: "420 mg → above the 400 mg limit" }
  ],
  "coffee-espresso-calculator": [
    { title: "Enter coffee dose", text: "The grams you're using.", example: "20 g coffee, 1:16 → 320 ml" },
    { title: "Pick the brew", text: "Espresso, pour-over, French press…", example: "20 g dose → 40 g espresso" },
    { title: "Get the ratio", text: "Exact water and yield for your taste.", example: "1:15 ratio → 300 ml pour-over" }
  ],
  "dough-batch-converter": [
    { title: "Enter the batch", text: "The amounts your dough recipe makes.", example: "1.2 kg batch at 72% hydration" },
    { title: "Set the target", text: "How many loaves or batches you need.", example: "Target 1.2 kg → 698 g flour" },
    { title: "Get the scale", text: "Every ingredient recalculated.", example: "×2.4 → all ingredients scaled" }
  ],
  "egg-timer": [
    { title: "Pick your style", text: "Soft, medium or hard boiled.", example: "Medium egg, soft → 6 min" },
    { title: "Set the size", text: "Small, medium or large eggs.", example: "Large egg, hard → 12 min" },
    { title: "Get the timing", text: "Perfect minutes and a live countdown.", example: "1,500 m altitude → +30 sec" }
  ],
  "food-shelf-life": [
    { title: "Pick the food", text: "What you have stored.", example: "Raw chicken, fridge → 1–2 days" },
    { title: "Choose the spot", text: "Fridge or freezer.", example: "Freezer → up to 9 months" },
    { title: "Get the date", text: "How long it lasts and when it expires.", example: "Raw chicken → good until Aug 6" }
  ],
  "food-storage-guide": [
    { title: "Pick the food", text: "Meat, dairy, produce…", example: "Chicken: fridge 1–2 days" },
    { title: "Choose the spot", text: "Fridge, freezer or pantry.", example: "Freezer → 9 months" },
    { title: "Get the rules", text: "Safe storage times and warning signs.", example: "Rice: pantry → 2 years" }
  ],
  "frying-temperature": [
    { title: "Pick the food", text: "Chicken, fries, fish…", example: "Chicken → 350°F / 177°C" },
    { title: "Check the oil", text: "Enter the temperature you're frying at.", example: "Fries → 375°F / 190°C" },
    { title: "Get the range", text: "The ideal frying temp in °C and °F.", example: "Fish → 365°F / 185°C" }
  ],
  "grams-cups-converter": [
    { title: "Enter the amount", text: "Cups, grams, spoons…", example: "1 cup flour → 125 g" },
    { title: "Pick the ingredient", text: "Flour, sugar, butter…", example: "1 cup honey → 340 g" },
    { title: "Get the conversion", text: "Weighted using the right density.", example: "2 cups sugar → 400 g" }
  ],
  "ingredient-substitution": [
    { title: "Pick the missing one", text: "The ingredient you've run out of.", example: "1 egg → flax + water" },
    { title: "Pick what you have", text: "Something already in your kitchen.", example: "1 cup buttermilk → milk + lemon" },
    { title: "Get the swap", text: "Exact ratio and how to use it.", example: "1 egg → 1 tbsp flax + 3 tbsp water" }
  ],
  "kitchen-timers": [
    { title: "Name a timer", text: "Pasta, roast, veggies…", example: "Pasta → 9:00" },
    { title: "Set the minutes", text: "Add as many timers as you need.", example: "Roast → 1:15:00" },
    { title: "Get alerted", text: "Each timer rings when it's done.", example: "3 timers → each rings" }
  ],
  "meal-prep-planner": [
    { title: "Set your goals", text: "Calories per day and weekly budget.", example: "2,000 kcal/day goal" },
    { title: "Press Generate plan", text: "A balanced week is built for you.", example: "2,000 kcal → balanced week" },
    { title: "Adjust & shop", text: "Swap any meal, then grab the list.", example: "$60 budget → 7 dinner plans" }
  ],
  "measurement-to-weight": [
    { title: "Add measurements", text: "Cups and spoons from your recipe.", example: "1 cup flour + ½ cup sugar" },
    { title: "Adjust amounts", text: "Until they match your recipe.", example: "1 cup flour → 125 g" },
    { title: "Get the weight", text: "Total grams for accurate baking.", example: "Total → 375 g" }
  ],
  "meat-cooking-time": [
    { title: "Pick the meat", text: "Type, cut and how you cook it.", example: "1.5 kg chicken, roast → 1:45" },
    { title: "Enter the weight", text: "In kg or pounds.", example: "Whole chicken 1.5 kg" },
    { title: "Get time & temp", text: "Exact cook time and target temperature.", example: "Target → 75°C internal" }
  ],
  "meat-doneness-guide": [
    { title: "Pick the meat", text: "And the cut you're cooking.", example: "Steak, medium-rare → 57°C" },
    { title: "Choose doneness", text: "Rare, medium, well done…", example: "Chicken → 74°C" },
    { title: "Get the temperature", text: "Target internal temp and rest time.", example: "Medium → 63°C + 5 min rest" }
  ],
  "nutrition-calculator": [
    { title: "Add ingredients", text: "With the amounts your recipe uses.", example: "4 servings of chicken & rice" },
    { title: "Set servings", text: "How many portions to divide by.", example: "4 servings → 4,200 kcal total" },
    { title: "Get nutrition", text: "Calories and macros per serving.", example: "Per serving → 1,050 kcal" }
  ],
  "pizza-dough-calculator": [
    { title: "Choose pizzas", text: "How many and how big.", example: "2 pizzas, 280 g balls" },
    { title: "Pick the style", text: "Neapolitan, New York, pan…", example: "2 × 280 g dough balls" },
    { title: "Get the dough", text: "Exact flour, water, yeast and salt.", example: "65% hydration → 363 g water" }
  ],
  "pressure-cooker-converter": [
    { title: "Pick the food", text: "Beans, meat, potatoes, rice…", example: "1.5 kg pork → 60 min" },
    { title: "Enter the amount", text: "How much you're cooking.", example: "High pressure, 60 min" },
    { title: "Get the time", text: "Exact pressure-cooking minutes.", example: "1.5 kg → 60 min total" }
  ],
  "recipe-comparator": [
    { title: "Add up to 3 recipes", text: "Time, cost, servings and nutrition.", example: "3 recipes side by side" },
    { title: "Fill the ingredients", text: "Amounts, prices and package sizes.", example: "Garlic chicken: $8.40 · 35 min" },
    { title: "Compare side by side", text: "Progress bars show the winner at a glance.", example: "Veggie stir-fry wins → $6.10" }
  ],
  "recipe-cost-calculator": [
    { title: "Add ingredients", text: "With the price you paid for each.", example: "4 servings, 6 ingredients" },
    { title: "Set the servings", text: "How many people the recipe feeds.", example: "Spaghetti for 4 → $9.20" },
    { title: "Get the cost", text: "Per batch and per serving.", example: "Per serving → $2.30" }
  ],
  "recipe-scaler": [
    { title: "Enter servings", text: "What the recipe makes and what you need.", example: "6 servings → 12 servings" },
    { title: "Add ingredients", text: "Each one with its amount and unit.", example: "6→12 = ×2.0" },
    { title: "Get scaled amounts", text: "Every ingredient recalculated instantly.", example: "×2.0 → 4 eggs, 500 g flour" }
  ],
  "sourdough-calculator": [
    { title: "Enter starter & flour", text: "The amounts in your recipe.", example: "80 g starter → 300 g" },
    { title: "Set hydration", text: "The dough consistency you want.", example: "1:2:2 feed → 80 g starter" },
    { title: "Get the formula", text: "Exact water, salt and dough weight.", example: "300 g at 100% hydration" }
  ],
  "sous-vide-guide": [
    { title: "Pick the protein", text: "Meat, fish or eggs.", example: "Steak, medium-rare → 55°C" },
    { title: "Choose doneness", text: "How done you like it.", example: "1.5 h at 55°C" },
    { title: "Get temp & time", text: "Water temperature and time range.", example: "Chicken → 65°C, 1–2 h" }
  ],
  "sweetener-converter": [
    { title: "Enter the sugar", text: "The amount your recipe calls for.", example: "100 g sugar → 75 g honey" },
    { title: "Pick the sweetener", text: "Honey, maple, stevia…", example: "Maple syrup → use 75 g" },
    { title: "Get the swap", text: "The exact amount to use instead.", example: "Stevia → 1/3 tsp" }
  ],
  "temperature-converter": [
    { title: "Enter the temperature", text: "Whatever your recipe says.", example: "350°F → 177°C" },
    { title: "Choose the unit", text: "Celsius, Fahrenheit or gas mark.", example: "350°F → gas mark 4" },
    { title: "Get all equivalents", text: "Every conversion shown at once.", example: "Fan oven → 160°C" }
  ],
  "unit-converter": [
    { title: "Type the amount", text: "The quantity you want to convert.", example: "2 cups → 473 ml" },
    { title: "Pick the units", text: "The unit you have and the unit you need.", example: "1 tbsp → 15 ml" },
    { title: "See the result", text: "The exact converted value in seconds.", example: "500 g → 17.6 oz" }
  ],
  "water-intake": [
    { title: "Enter your weight", text: "In kg or pounds.", example: "70 kg → 2,450 ml" },
    { title: "Set activity", text: "How active your day is.", example: "30 min exercise → +350 ml" },
    { title: "Get your target", text: "Daily water in liters and glasses.", example: "2.45 L ≈ 10 cups" }
  ],
  "weekly-menu-generator": [
    { title: "Pick your meals", text: "Choose from the dish list.", example: "7 nights, no repeat protein" },
    { title: "Press generate", text: "The tool builds the week.", example: "7-night plan in seconds" },
    { title: "Lock & adjust", text: "Swap any day you don't like.", example: "Swap 1 night → locked in" }
  ]
};

/** Three blank steps — the starting point for a brand-new tool in the editor. */
export function emptyQuickGuide(): QuickGuideStep[] {
  return [
    { title: "", text: "", example: "" },
    { title: "", text: "", example: "" },
    { title: "", text: "", example: "" }
  ];
}

/**
 * Parse a tools.quick_guide column (JSON string) into steps. Anything that
 * isn't a JSON array of {title,text} objects falls back to an empty list, so
 * a corrupt value never crashes the tool page or the editor. The optional
 * example field is preserved when present (and a string).
 */
export function parseQuickGuide(raw: string | null | undefined): QuickGuideStep[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (s) =>
          s && typeof s === "object" && typeof s.title === "string" && typeof s.text === "string"
      )
      .map((s) => ({
        title: s.title,
        text: s.text,
        ...(typeof s.example === "string" ? { example: s.example } : {})
      }));
  } catch {
    return [];
  }
}

/** Serialize steps back to the column format (example included when non-empty). */
export function serializeQuickGuide(steps: QuickGuideStep[]): string {
  return JSON.stringify(
    steps.map((s) => ({
      title: s.title || "",
      text: s.text || "",
      ...(s.example ? { example: s.example } : {})
    }))
  );
}

/** True when every step has both a title and some text (used by the editor's
 * "required" validation for new tools). */
export function isCompleteQuickGuide(steps: QuickGuideStep[]): boolean {
  return (
    Array.isArray(steps) &&
    steps.length >= 1 &&
    steps.every((s) => s.title.trim().length > 0 && s.text.trim().length > 0)
  );
}
