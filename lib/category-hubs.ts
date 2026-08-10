/**
 * SEO content for the category hub pages (/tools/baking, /tools/nutrition…).
 *
 * Each hub gets a full page of original, useful text — an intro, a
 * "how these tools work" section and a FAQ — so Google has real content to
 * index beyond the tool cards. The `category` field must match the tools
 * table's category column exactly; the tool grid is always queried live so
 * the hubs stay correct even when the admin adds tools.
 */

export interface CategoryHub {
  /** URL slug, e.g. "baking" → /tools/baking */
  slug: string;
  /** Exact category column value in the tools table. */
  category: string;
  title: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  /** Paragraphs for the "About this category" section. */
  intro: string[];
  /** Plain-language "how these tools work" section. */
  howItWorks: string;
  faqs: { q: string; a: string }[];
  /** Other hub slugs to cross-link (internal linking for SEO). */
  related: string[];
}

const HUBS: CategoryHub[] = [
  {
    slug: "baking",
    category: "Baking",
    title: "Baking Tools & Calculators",
    tagline:
      "Dough hydration, pan conversions, sugar swaps and baker's percentages — the calculators that take the guesswork out of baking.",
    metaTitle: "Baking Calculators — Hydration, Pan Sizes & Sugar Swaps | CookChase",
    metaDescription:
      "Free baking calculators: bread hydration, dough batch sizes, pan conversions and sugar-to-sweetener swaps. Bake with exact measurements, every time.",
    intro: [
      "Baking is the most precise form of cooking: a few extra grams of water changes a crust, and the wrong pan size can turn a cake into a puddle. These baking tools handle the math so you can focus on technique — hydration percentages for better bread, exact dough weights for consistent batches, and honest sugar swaps that keep sweetness (and texture) in check.",
      "Every calculator on this page is free, works in your browser without an account, and shows its formula in plain language. If you bake the same recipes regularly, these are the tools that quietly make every batch more predictable."
    ],
    howItWorks:
      "Baking tools work on ratios that bakers have relied on for centuries. Hydration is the weight of water divided by the weight of flour — a 70% hydration dough uses 700 g of water per 1000 g of flour. Pan conversions compare the surface area of two pans and scale every ingredient by that factor. Sugar swaps use sweetness multipliers (honey is about 1.25× sweeter than sugar, and 1 cup of honey replaces about ¾ cup of sugar). Each tool applies that single, honest formula to the numbers you enter.",
    faqs: [
      {
        q: "What is dough hydration and why does it matter?",
        a: "Hydration is the percentage of water relative to flour weight. A 70% hydration dough has 700 g water per 1000 g flour. Higher hydration gives a more open crumb and crispier crust, but the dough is stickier and harder to shape. The hydration calculator converts between flour weight, water weight and percentage so you can scale any recipe confidently."
      },
      {
        q: "How do I convert a recipe to a different pan size?",
        a: "Compare the surface area of the two pans, not their names. A 9-inch round pan has about 64 square inches; an 8-inch round has about 50. Divide the new area by the original area to get the multiplier (64 ÷ 50 = 1.28), then multiply every ingredient by that number. The pan converter does this for square, round and rectangular pans."
      },
      {
        q: "Can I swap honey or maple syrup for sugar in any recipe?",
        a: "Yes, but not one-for-one. Honey and maple syrup are sweeter and add liquid. A good starting rule: replace 1 cup of sugar with ¾ cup of honey, and reduce the other liquids by about 3 tablespoons per cup swapped. The sweetener converter computes the exact amount for granulated sugar, brown sugar, honey, maple syrup, stevia and erythritol."
      },
      {
        q: "Why does weighing flour give better results than cups?",
        a: "A 'cup' of flour can weigh anywhere from 110 g to 140 g depending on how you scoop. Weighing eliminates that variation entirely. The measurement-to-weight converter and grams-to-cups tools use standard density values (125 g per cup of all-purpose flour) so your recipe stays consistent batch after batch."
      }
    ],
    related: ["kitchen-helpers", "calculators", "nutrition"]
  },
  {
    slug: "calculators",
    category: "Calculators",
    title: "Cooking Calculators",
    tagline:
      "Scale recipes, cost out meals and compare dishes — the quick math tools that make everyday cooking easier.",
    metaTitle: "Cooking Calculators — Scale Recipes & Costs | CookChase",
    metaDescription:
      "Free cooking calculators: scale any recipe up or down, work out exactly what a dish costs per serving, and compare recipes. Fast, accurate and free.",
    intro: [
      "Home cooks do more math than they realize: halving a recipe for two, pricing a meal to beat takeout, or deciding whether to cook from scratch. These calculators do that work instantly and honestly, with the formula shown so you always know how the answer was reached.",
      "No accounts, no paywalls, no app to install. Type in your numbers and the result appears as you type."
    ],
    howItWorks:
      "The recipe scaler multiplies every ingredient by the ratio of new servings to original servings. The cost calculator sums each ingredient's price (your price divided by package size, times the amount used) and divides by servings for a true per-portion cost. The comparator lines two recipes up side by side — time, cost, servings and nutrition — so a decision becomes a comparison instead of a guess.",
    faqs: [
      {
        q: "How do I scale a recipe from 4 to 6 servings?",
        a: "Divide the new serving count by the original: 6 ÷ 4 = 1.5. Multiply every ingredient by 1.5. The recipe scaler does this for all ingredients at once, including fractions like 1/3 cup, so you never have to do the mental math."
      },
      {
        q: "How do I know what a recipe really costs?",
        a: "Divide each package price by its size to get a unit price (e.g. $3.49 ÷ 500 g = $0.007 per gram), multiply by the amount the recipe uses, and add everything up. The cost calculator tracks this per ingredient and reports both the batch total and the cost per serving."
      },
      {
        q: "Is cooking from scratch actually cheaper than takeout?",
        a: "Usually yes for the same ingredients, but the comparison only counts if you price honestly. The recipe cost calculator adds up real ingredient costs so you can compare your homemade version against a takeout price and see the actual gap — often 40–60% cheaper per serving."
      }
    ],
    related: ["nutrition", "baking", "planners"]
  },
  {
    slug: "cooking-guides",
    category: "Cooking Guides",
    title: "Cooking Guides & Reference Tools",
    tagline:
      "Meat temperatures, frying oil, food storage and shelf life — the reference calculators that keep your kitchen safe and consistent.",
    metaTitle: "Cooking Guides — Temperatures, Frying & Food Storage | CookChase",
    metaDescription:
      "Free cooking reference tools: safe meat temperatures, frying oil temperatures, food storage and shelf-life guides, and sous-vide settings. Cook safely with confidence.",
    intro: [
      "Some cooking knowledge isn't technique — it's reference. What's the safe internal temperature for chicken? What oil temperature fries without burning? How long does an open jar of sauce last in the fridge? These guides encode the food-safety and cooking-science answers in tools that give you an instant, correct answer.",
      "Every value is grounded in USDA food-safety guidelines and standard culinary practice, and each tool explains the reasoning behind the number."
    ],
    howItWorks:
      "Temperature tools map your cut of meat to its USDA-recommended safe internal temperature and give carryover guidance (meat keeps cooking 5°F after you pull it from the heat). Frying tools recommend the right oil temperature for the food and smoke point of your oil. Shelf-life and storage tools use food-safety rules of thumb — 2-hour room-temperature rule, 3–4 days for most cooked leftovers — applied to whatever you enter.",
    faqs: [
      {
        q: "What is the safe internal temperature for chicken?",
        a: "The USDA recommends 165°F (74°C) for all poultry, including whole birds, breasts, thighs and ground chicken. The meat temperature tools give both the target and the pull temperature — take the meat off the heat about 5°F early and let carryover finish the job."
      },
      {
        q: "What temperature should frying oil be?",
        a: "Most frying works best between 350°F and 375°F. Too low (below 325°F) and food soaks up oil; too high (over 400°F) and it browns before cooking through. The frying temperature tool also checks your oil's smoke point so nothing burns."
      },
      {
        q: "How long can leftovers stay in the fridge?",
        a: "Most cooked food is safe for 3–4 days in the fridge. Perishable food should not sit at room temperature for more than 2 hours (1 hour if it's over 90°F). The shelf-life tool gives specific guidance for meat, dairy, produce and pantry staples."
      }
    ],
    related: ["meat-and-seafood", "baking", "kitchen-helpers"]
  },
  {
    slug: "drinks",
    category: "Drinks",
    title: "Drink & Beverage Calculators",
    tagline:
      "Coffee ratios, caffeine counts, alcohol cook-off and hydration — the tools that get your drinks exactly right.",
    metaTitle: "Drink Calculators — Coffee, Caffeine & Hydration | CookChase",
    metaDescription:
      "Free drink calculators: perfect coffee-to-water ratios, espresso yields, caffeine estimates, alcohol cook-off times and daily water intake. Brew and sip with confidence.",
    intro: [
      "A great cup of coffee is a ratio, not a mystery. These beverage tools turn brewing, caffeine tracking and hydration into numbers you can trust — from the perfect 1:16 pour-over to how much water you actually need each day.",
      "Whether you're dialing in espresso, cutting back on caffeine or simply aiming to drink more water, each calculator gives a clear answer and explains the reasoning."
    ],
    howItWorks:
      "Coffee tools use the golden ratio of 1 part coffee to 15–18 parts water (a balanced 1:16 for most methods) and scale it to your batch. Espresso tools convert dose and yield into ristretto, normale or lungo shots. Caffeine estimates use typical mg-per-100 ml values for coffee, tea and energy drinks. The hydration calculator uses the standard 30–35 ml per kg of body weight guideline, adjusted for activity and climate.",
    faqs: [
      {
        q: "What is the best coffee-to-water ratio?",
        a: "For most brew methods, 1:16 (1 g of coffee per 16 ml of water) is a balanced starting point. Stronger drinkers prefer 1:14–1:15; lighter cups go to 1:17–1:18. The coffee calculator scales this to any batch size and shows the exact grams and milliliters."
      },
      {
        q: "How much caffeine is in my coffee?",
        a: "A typical 240 ml cup of brewed coffee has about 95 mg of caffeine; espresso around 63 mg per shot; black tea 47 mg; green tea 28 mg. The caffeine calculator totals your day so you can see where you land against the 400 mg guideline for healthy adults."
      },
      {
        q: "How much water should I drink a day?",
        a: "A widely used guideline is 30–35 ml of water per kilogram of body weight — about 2.1–2.4 L for a 70 kg person. Activity, heat and sweating increase that. The hydration calculator tailors the number to your weight and lifestyle."
      }
    ],
    related: ["nutrition", "kitchen-helpers", "calculators"]
  },
  {
    slug: "kitchen-helpers",
    category: "Kitchen Helpers",
    title: "Kitchen Helper Tools",
    tagline:
      "Unit converters, timers, substitutions and measurement helpers — the everyday utilities every kitchen needs.",
    metaTitle: "Kitchen Helper Tools — Unit Converters & Substitutions | CookChase",
    metaDescription:
      "Free kitchen helper tools: convert cups, grams, ounces and temperatures, find ingredient substitutions, run multiple timers and convert measurements to weight.",
    intro: [
      "Every cook hits the same wall: a recipe in cups when you only have a scale, a missing ingredient at the worst moment, or three dishes needing three timers. Kitchen helpers are the small utilities that unstick those moments instantly.",
      "They're deliberately simple — pick what you need, enter your numbers, and get a clear answer. No sign-up, no clutter."
    ],
    howItWorks:
      "Unit converters use fixed, well-established factors: 1 US cup is 236.6 ml, 16 tablespoons, 48 teaspoons; 1 ounce is 28.35 g. Temperature converters apply the standard formulas (°C = (°F − 32) × 5/9). Substitution tools use ratio-based swaps with cooking notes, so replacing buttermilk or sour cream keeps the chemistry of the recipe working. Multi-timers simply run several countdowns at once.",
    faqs: [
      {
        q: "How many grams are in a cup of flour?",
        a: "One US cup of all-purpose flour weighs about 125 g — but it varies by ingredient and scooping method, which is why the grams-to-cups converter uses ingredient-specific density values (a cup of honey is 340 g, for example)."
      },
      {
        q: "What can I substitute for buttermilk?",
        a: "The classic swap: 1 cup of milk plus 1 tablespoon of lemon juice or white vinegar, left to sit 5–10 minutes until it thickens. For baking, yogurt or sour cream thinned with milk also work. The substitution finder gives ratios and notes for 80+ ingredients."
      },
      {
        q: "How do I convert 350°F to Celsius?",
        a: "Subtract 32, multiply by 5, divide by 9: (350 − 32) × 5/9 = 176.7°C. Most ovens call that 180°C. The oven temperature converter also shows gas marks and fan (convection) settings."
      }
    ],
    related: ["baking", "cooking-guides", "drinks"]
  },
  {
    slug: "meal-planning",
    category: "Meal Planning",
    title: "Meal Planning Tools",
    tagline:
      "Generate a week of balanced dinners, plan meal prep and build one shopping list from it all.",
    metaTitle: "Meal Planning Tools — Weekly Dinners & Prep | CookChase",
    metaDescription:
      "Free meal planning tools: generate a 7-day dinner plan with balanced proteins and no repeats, plan meal prep, and turn the whole week into one shopping list.",
    intro: [
      "The hardest part of eating well isn't cooking — it's deciding what to cook, five or seven times a week. These planning tools remove that daily decision by generating balanced menus and turning your choices into a single organized shopping list.",
      "Plan once on the weekend, shop once, and let the week run itself."
    ],
    howItWorks:
      "The dinner menu generator builds a 7-day plan from a rotating set of meals, keeping proteins balanced and avoiding repeats within the week. The meal prep planner takes the meals you choose and merges their ingredients into one categorized shopping list, flagging which dishes can be made ahead and which must be fresh.",
    faqs: [
      {
        q: "How does the weekly menu generator avoid repeats?",
        a: "It tracks the protein family of every meal — chicken, beef, fish, beans, tofu, eggs and more — and rotates through them so no family repeats on consecutive days and no dish appears twice in the same week. The result is a naturally varied plan without any planning effort."
      },
      {
        q: "How do I turn a meal plan into a shopping list?",
        a: "Open the meal prep planner and add each meal from your week. It combines every ingredient, groups them by category (produce, dairy, pantry, protein) and produces one consolidated list — no double-buying, no forgotten items."
      },
      {
        q: "Which meals are best for make-ahead prep?",
        a: "Batch-friendly dishes like grain bowls, soups, casseroles, cooked proteins and overnight oats hold up for 3–4 days refrigerated. Delicate items like salads with dressing and crisp vegetables are best made fresh. The planner flags which category each meal falls into."
      }
    ],
    related: ["planners", "nutrition", "calculators"]
  },
  {
    slug: "meat-and-seafood",
    category: "Meat & Seafood",
    title: "Meat & Seafood Calculators",
    tagline:
      "Cooking times, internal temperatures, doneness and brines — perfect proteins, safely and consistently.",
    metaTitle: "Meat & Seafood Calculators — Temperatures & Times | CookChase",
    metaDescription:
      "Free meat and seafood calculators: roast times, safe internal temperatures, doneness guides and brine ratios. Cook proteins perfectly and safely every time.",
    intro: [
      "Few things in cooking are as rewarding — or as stressful — as getting a roast right. These tools take the two variables that decide the outcome, time and temperature, and calculate them for your exact cut and weight.",
      "Every temperature is USDA food-safety backed, and every time estimate follows standard roasting math (minutes per unit of weight, adjusted for doneness)."
    ],
    howItWorks:
      "The meat cooking time calculator uses per-weight roasting rates for each cut (e.g. about 20 minutes per 450 g at 175°C for a whole chicken) and adds expected rest time. The doneness guide maps internal temperatures to doneness levels — rare, medium-rare, medium and beyond — with carryover explained. The brine calculator scales salt and sugar to your water volume at a target percentage (5% is a classic wet brine).",
    faqs: [
      {
        q: "How long does it take to roast a chicken?",
        a: "A whole chicken takes roughly 20 minutes per 450 g at 175°C (350°F) — a 1.5 kg bird needs about 65–75 minutes — plus 10–15 minutes resting. The calculator gives the time for your exact weight and alerts you to the safe 74°C internal target."
      },
      {
        q: "What temperature is medium-rare steak?",
        a: "Medium-rare beef is 52–55°C (125–130°F) internal. Pull the steak about 5°F early because carryover cooking raises it another few degrees while it rests. The doneness guide shows the full range for beef, pork, lamb, poultry and fish."
      },
      {
        q: "What is a good brine ratio?",
        a: "A 5% wet brine is the classic all-purpose ratio: 50 g of salt per litre of water, plus sugar to taste (often 30 g per litre). The brine calculator adjusts salt and sugar for your exact water volume and weight of meat."
      }
    ],
    related: ["cooking-guides", "baking", "nutrition"]
  },
  {
    slug: "nutrition",
    category: "Nutrition & Health",
    title: "Nutrition & Health Calculators",
    tagline:
      "Recipe calories, macros, water intake and caffeine — see what's really on your plate and in your day.",
    metaTitle: "Nutrition Calculators — Calories, Macros & Hydration | CookChase",
    metaDescription:
      "Free nutrition calculators: estimate calories and macros for any recipe, track daily water intake and see your caffeine consumption. Know what's on your plate.",
    intro: [
      "Eating well is easier when you can see the numbers. These nutrition tools estimate what a recipe really contains, how much water your body needs and how much caffeine you're taking in — all from simple inputs you already know.",
      "Estimates are based on standard USDA nutrient values, and every tool is honest about being an estimate rather than a lab analysis."
    ],
    howItWorks:
      "The nutrition calculator estimates calories and macros by looking up standard per-100 g values for each ingredient, scaling by your amounts and dividing by servings. The water intake tool applies the 30–35 ml per kg guideline with activity adjustments. The caffeine calculator sums typical caffeine contents across coffee, tea and energy drinks.",
    faqs: [
      {
        q: "How accurate is the recipe nutrition calculator?",
        a: "It uses USDA-standard nutrient values per ingredient, so for recipes made from whole ingredients it's typically within 10–15% of a lab analysis. Prepared foods, restaurant dishes and 'to taste' amounts are less predictable — the tool flags those assumptions."
      },
      {
        q: "How much water should I drink based on my weight?",
        a: "A common guideline is 30–35 ml per kilogram of body weight — about 2.1–2.4 L for a 70 kg person. Add 500–750 ml for exercise and more in hot weather. The calculator personalizes the number."
      },
      {
        q: "How many calories should I eat in a day?",
        a: "It depends on age, sex, weight, height and activity. A common estimate is about 2,000 kcal for women and 2,500 kcal for men, but individual needs vary widely. The nutrition calculator focuses on what's in a recipe; for personal targets, consult the dietary guidelines for your profile."
      }
    ],
    related: ["drinks", "calculators", "meal-planning"]
  },
  {
    slug: "planners",
    category: "Planners",
    title: "Recipe & Meal Prep Planners",
    tagline:
      "Compare recipes side by side and plan a week of meal prep with a combined shopping list.",
    metaTitle: "Recipe & Meal Prep Planners | CookChase",
    metaDescription:
      "Free recipe planning tools: compare up to three recipes head-to-head on time, cost and nutrition, and plan a 5 or 7-day meal prep week with one combined shopping list.",
    intro: [
      "Choosing between recipes, or planning a week of cooking, shouldn't require a spreadsheet. These planners do the organizing work so the decision — and the week — practically runs itself.",
      "Compare a recipe against takeout or against another dish, then plan the week and shop from a single merged list."
    ],
    howItWorks:
      "The recipe comparator lines two recipes up in a side-by-side table covering prep time, cook time, servings, estimated cost and nutrition, so the trade-offs are visible at a glance. The meal prep planner merges the ingredients of every meal you choose into one categorized shopping list and notes which dishes freeze or store well.",
    faqs: [
      {
        q: "How do I decide between two recipes?",
        a: "Compare the things that actually matter for your evening: total time, cost per serving, servings produced and nutrition. The comparator presents both recipes side by side on those four axes so the better fit for tonight is obvious in seconds."
      },
      {
        q: "What should I prep on the weekend for an easy week?",
        a: "Start with grains, a couple of cooked proteins and a big batch of roasted vegetables — they reheat well and combine into endless meals. The meal prep planner turns your chosen dishes into one shopping list and flags which components can be made ahead."
      },
      {
        q: "How long do meal-prepped meals last in the fridge?",
        a: "Most cooked components are safe for 3–4 days refrigerated; soups and stews often taste better on day two. Freeze anything you won't eat within four days. The planner helps you choose a mix that fits your week."
      }
    ],
    related: ["meal-planning", "calculators", "nutrition"]
  }
];

const BY_SLUG = new Map(HUBS.map((h) => [h.slug, h]));

/** Look up a hub by its URL slug. */
export function getCategoryHub(slug: string): CategoryHub | undefined {
  return BY_SLUG.get(slug);
}

/** All hub slugs (for the sitemap and cross-linking). */
export function getAllHubSlugs(): string[] {
  return HUBS.map((h) => h.slug);
}

/** Slugify a raw category name ("Nutrition & Health" → "nutrition"). */
export function categoryToSlug(category: string): string | undefined {
  const hub = HUBS.find(
    (h) => h.category.toLowerCase() === category.toLowerCase()
  );
  return hub?.slug;
}

/** Look up a hub by its exact category name. */
export function getHubByCategory(category: string): CategoryHub | undefined {
  return HUBS.find(
    (h) => h.category.toLowerCase() === category.toLowerCase()
  );
}
