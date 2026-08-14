export interface SeedTool {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  icon: string;
  description: string;
  how_to_use: string;
  formula: string;
  code: string;
  faq: { q: string; a: string }[];
  tips: string[];
  meta_title: string;
  meta_description: string;
  featured: number;
  sort_order: number;
}

export const siteSettingsSeed: Record<string, string> = {
  site_name: "CookChase",
  site_tagline: "Free cooking tools, calculators & kitchen guides",
  site_logo_text: "CookChase",
  site_email: "hello@cookchase.com",
  site_url: "https://cookchase.com",
  site_description:
    "CookChase is a free collection of interactive cooking tools, kitchen calculators and practical guides — built to help home cooks scale recipes, convert units, plan meals and cook with confidence.",
  footer_text:
    "CookChase helps home cooks scale recipes, convert measurements and plan meals — all with free, no-frills tools.",
  social_twitter: "https://twitter.com/cookchase",
  social_facebook: "https://facebook.com/cookchase",
  social_instagram: "https://instagram.com/cookchase",
  social_pinterest: "https://pinterest.com/cookchase",
  adsense_client: "",
  adsense_enabled: "0",
  // Leave empty to have /ads.txt generated from adsense_client; set it to
  // serve those exact lines instead (extra networks, resellers, …).
  ads_txt: "",
  google_verification: "",
  google_verification_file: "",
  bing_verification: "",
  yandex_verification: "",
  pinterest_verification: "",
  alerts_enabled: "1",
  alert_views_threshold: "200",
  alert_comments_threshold: "10",
  alert_article_views_threshold: "100",
  alert_article_comments_threshold: "5",
  notify_tool_created: "1",
  notify_content_edited: "1",
  notify_contact: "1",
  notify_spike_alert: "1",
  // Automatic monthly performance report (emailed on the 1st of each month).
  monthly_report_enabled: "1",
  monthly_report_format: "pdf", // "pdf" | "csv" | "both"
  monthly_report_recipient: "", // empty = SMTP notify email
  monthly_report_last_sent: "", // "YYYY-MM" guard against duplicate sends
  analytics_id: "",
  default_meta_title: "CookChase — Free Cooking Tools, Calculators & Kitchen Guides",
  default_meta_description:
    "20+ free interactive cooking tools: recipe scaler, unit converter, meat cooking times, baking calculators, meal prep planner and more.",
  default_keywords:
    "cooking tools, recipe calculator, kitchen unit converter, baking calculator, meal prep planner, cooking times",
  cookie_notice: "We use cookies to improve your experience and to serve personalized ads. By continuing you agree to our Privacy Policy.",
  homepage_meta_title: "CookChase — Free Cooking Tools & Kitchen Calculators",
  homepage_meta_description:
    "Discover 20+ free interactive cooking tools and calculators. Scale recipes, convert units, time your roasts, plan meal prep and bake with confidence."
};

export const toolsSeed: SeedTool[] = [
  {
    slug: "recipe-scaler",
    name: "Recipe Scaler",
    tagline: "Scale any recipe up or down in seconds — ingredients, servings and all.",
    category: "Calculators",
    icon: "Calculator",
    description:
      "The Recipe Scaler multiplies or divides every ingredient in your recipe based on the number of servings you actually need. Cooking for two instead of four? Doubling a casserole for a potluck? Enter your original servings, the servings you want, and the tool recalculates every measurement for you.\n\nScaling a recipe is not always a straight multiplication. For baked goods, simply doubling flour, sugar and eggs can change the texture of the final result. This tool gives you the exact scaled amounts, and our baking tips help you adjust pans and bake times when you scale.",
    how_to_use:
      "1. Enter the number of servings the recipe currently makes.\n2. Enter how many servings you want to make.\n3. Add each ingredient with its amount and unit (choose from the unit dropdown).\n4. The scaled amount for every ingredient is calculated instantly.\n5. Use the copy button to export the scaled list as plain text.",
    formula:
      "The tool figures out a single multiplier for your whole recipe: the servings you want divided by the servings the recipe makes. Want 6 servings from a recipe that makes 4? That is 6 divided by 4, or 1.5, so every ingredient gets multiplied by 1.5. The proportions stay exactly the same - you just end up with more or less of everything, and the tool does the arithmetic for you.",
    code:
      "function scaleRecipe(ingredients, originalServings, desiredServings) {\n  const factor = desiredServings / originalServings;\n  return ingredients.map((ing) => ({\n    name: ing.name,\n    amount: ing.amount * factor,\n    unit: ing.unit\n  }));\n}",
    faq: [
      {
        q: "Why shouldn't I just multiply everything by the same number when baking?",
        a: "Baking is a chemical process. Doubling flour, water and yeast works for many breads, but eggs, leavening and salt don't always behave linearly. A safer approach for cakes and pastries is to scale by weight and only slightly reduce leavening, salt and spices (about 25% less than a strict doubling)."
      },
      {
        q: "What if my scaled amount looks awkward, like 0.33 cup?",
        a: "Use the unit converter to translate 0.33 cup into a friendlier measurement — 1/3 cup — or weigh it in grams for precision. Weights are always the most accurate way to scale."
      },
      {
        q: "Should I scale cook time when I double a recipe?",
        a: "Not usually — a bigger batch in a bigger pan often needs only 10-15% more time. A taller pan of lasagna, for example, needs more time than a doubled, thin tray. Always check with a thermometer."
      }
    ],
    tips: [
      "Scale by weight, not volume, for the most consistent results.",
      "Reduce salt, sugar and spices to about 75% when scaling beyond 3x.",
      "Watch the first batch closely — your oven and pan may behave differently than the original recipe author's."
    ],
    meta_title: "Recipe Scaler — Scale Any Recipe Up or Down | CookChase",
    meta_description:
      "Free recipe scaler: enter servings and get every ingredient recalculated instantly. Doubling or halving recipes made simple, with baking tips.",
    featured: 1,
    sort_order: 1
  },
  {
    slug: "unit-converter",
    name: "Kitchen Unit Converter",
    tagline: "Convert cups, grams, ounces, milliliters, tablespoons and more.",
    category: "Kitchen Helpers",
    icon: "Scale",
    description:
      "Every home cook hits the wall of unit conversions: is 8 ounces of flour the same as 8 fluid ounces? How many grams are in a cup of butter? This kitchen unit converter handles volume, weight, temperature and spoon sizes with a single clean interface.\n\nBecause a cup of flour and a cup of honey weigh very differently, the tool includes a quick ingredient-aware weight reference for the most common pantry staples, so you can move confidently between volume and weight.",
    how_to_use:
      "1. Pick a category: Volume, Weight, Temperature or Spoon sizes.\n2. Enter the amount you want to convert.\n3. Choose the source unit on the left and the target unit on the right.\n4. Read your result instantly, with common equivalent shown below.",
    formula:
      "The converter uses a fixed reference for every unit - for example, 1 cup is 236.588 milliliters and 1 ounce is 28.3495 grams. To convert, it compares the size of your starting unit with the size of the unit you want, and scales your amount by that ratio. Pick a unit on each side and the answer appears instantly.",
    code:
      "const VOLUME = { cup: 236.588, tbsp: 14.787, tsp: 4.929, ml: 1, oz_fl: 29.574, liter: 1000 };\nconst WEIGHT = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };\n\nfunction convert(amount, fromUnit, toUnit, system) {\n  const table = system === 'volume' ? VOLUME : WEIGHT;\n  return (amount * table[fromUnit]) / table[toUnit];\n}",
    faq: [
      {
        q: "Why is 8 oz of flour different from 8 fluid ounces?",
        a: "Fluid ounces measure volume (space), while ounces measure weight (mass). A fluid ounce of flour weighs less than a fluid ounce of water. When a recipe says '8 oz flour', it usually means weight — about 227 g, which is roughly 1¾ cups."
      },
      {
        q: "Is 1 cup of butter really 227 grams?",
        a: "Yes — butter is about 227 g per cup (16 tablespoons). Butter is one of the few ingredients where volume-to-weight is highly consistent."
      },
      {
        q: "What is the metric difference between a US cup and a UK cup?",
        a: "A US cup is 236.6 ml. A UK 'metric cup' is 250 ml. For precise baking, this 5% difference matters — most modern recipes use the US cup."
      }
    ],
    tips: [
      "Bookmark the volume-to-weight reference for flour, sugar and butter.",
      "Use a digital scale for anything you bake more than once.",
      "When a recipe is ambiguous, assume 'oz' means weight unless it says 'fluid oz'."
    ],
    meta_title: "Kitchen Unit Converter — Cups, Grams, Oz, ml | CookChase",
    meta_description:
      "Free kitchen unit converter. Convert cups to grams, ounces to milliliters, tablespoons, teaspoons and more. Includes common baking weight references.",
    featured: 1,
    sort_order: 2
  },
  {
    slug: "temperature-converter",
    name: "Oven Temperature Converter",
    tagline: "Convert Fahrenheit, Celsius and gas marks for every oven setting.",
    category: "Kitchen Helpers",
    icon: "Thermometer",
    description:
      "Is 180°C the same as 350°F? Mostly — but converting oven temperatures exactly matters more than most people think. This oven temperature converter moves between Fahrenheit, Celsius and gas mark, and includes a quick reference of the most common oven settings used in recipes around the world.\n\nIt also explains fan/convection conversion, because a fan oven runs hotter than a conventional one — a detail that quietly ruins countless roasts and bakes.",
    how_to_use:
      "1. Enter the temperature your recipe calls for.\n2. Pick the unit it is in (Fahrenheit, Celsius or Gas Mark).\n3. Read the conversions for all other units instantly.\n4. Check the fan oven conversion note if you use a convection oven.",
    formula:
      "The tool converts between temperature scales using the standard formulas: to go from Fahrenheit to Celsius, subtract 32, multiply by 5, then divide by 9 - and reverse those steps to go the other way. Gas marks are an older British scale that roughly equals the Celsius temperature divided by 140, minus 1. The tool does all of this for you as you type.",
    code:
      "function cToF(c) { return (c * 9) / 5 + 32; }\nfunction fToC(f) { return ((f - 32) * 5) / 9; }\nfunction cToGas(c) { return Math.round(c / 140 - 1); }\nfunction fToGas(f) { return Math.round(fToC(f) / 140 - 1); }",
    faq: [
      {
        q: "Is a fan oven hotter than a regular oven?",
        a: "Yes. Convection (fan) ovens circulate hot air, so food cooks faster. The rule of thumb is to reduce the temperature by 20°C (about 25°F) and check for doneness 10-15% sooner."
      },
      {
        q: "What's the difference between 180°C and 350°F?",
        a: "180°C converts to exactly 356°F. Most recipes treat them as equivalent because a few degrees either way barely matters — ovens vary more than that on their own."
      },
      {
        q: "What temperature is 'moderate' in an old recipe?",
        a: "Older recipes use words like slow, moderate and hot. Moderate generally means 180°C / 350°F. Slow is about 150°C / 300°F, and hot is around 220°C / 425°F."
      }
    ],
    tips: [
      "Invest in an oven thermometer — dials drift, and few ovens are truly accurate.",
      "When baking cakes, always preheat for at least 15 minutes after the light goes out.",
      "For fan ovens, drop the temperature first and then only reduce time if food is browning too fast."
    ],
    meta_title: "Oven Temperature Converter — °F to °C to Gas Mark | CookChase",
    meta_description:
      "Free oven temperature converter between Fahrenheit, Celsius and gas marks. Includes fan oven adjustments and common cooking temperature references.",
    featured: 0,
    sort_order: 3
  },
  {
    slug: "recipe-cost-calculator",
    name: "Recipe Cost Calculator",
    tagline: "Find out exactly what a recipe costs — per batch and per serving.",
    category: "Calculators",
    icon: "Coins",
    description:
      "Ever wondered what your famous lasagna actually costs to make? The Recipe Cost Calculator adds up every ingredient's cost and breaks the total down per serving, so you can budget meals, price meal-prep portions, or compare a homemade dish against takeout.\n\nEnter the amount you paid and the package size it came in — e.g. $3.49 for a 500 g bag of rice — and the tool works out the cost of just the portion your recipe uses.",
    how_to_use:
      "1. Enter how many servings the recipe makes.\n2. Add each ingredient: name, amount used, purchase price and package size.\n3. Add a line for extra costs like energy, if you like.\n4. Read the total recipe cost and cost per serving instantly.",
    formula:
      "Each ingredient is priced by the unit: divide what you paid by the size of the package to get the price per unit, then multiply by how much the recipe actually uses. Adding up every ingredient gives the total recipe cost, and dividing by the number of servings shows the cost per plate.",
    code:
      "function costRecipe(ingredients, servings) {\n  const total = ingredients.reduce((sum, ing) => {\n    const unitPrice = ing.price / ing.packageSize;\n    return sum + ing.amountUsed * unitPrice;\n  }, 0);\n  return { total: total, perServing: total / servings };\n}",
    faq: [
      {
        q: "Should I include utilities and spices in recipe cost?",
        a: "Most home cooks ignore them because the amounts are tiny. For a meal-prep business you should add a small allowance — spices, oil and energy typically add 5-10% to a savory dish's true cost."
      },
      {
        q: "Why is my per-serving cost lower than takeout?",
        a: "Homemade meals almost always win on cost per serving because you're not paying labor, rent or packaging. The gap shrinks with premium ingredients like aged cheese or seafood."
      },
      {
        q: "What unit should package size be in?",
        a: "Use the same unit you use for the amount in the recipe — if the recipe uses 200 g of rice, measure the package in grams (500 g). The math works for any consistent unit."
      }
    ],
    tips: [
      "Buy staples in bulk and recalculate — the unit price usually drops dramatically.",
      "Use this tool to price meal-prep boxes if you sell them.",
      "Seasoning blends are the silent budget-killers; include them once per week."
    ],
    meta_title: "Recipe Cost Calculator — Cost Per Serving | CookChase",
    meta_description:
      "Free recipe cost calculator. Add ingredients and serving count to see total recipe cost and exact cost per serving. Great for meal prep and budgeting.",
    featured: 1,
    sort_order: 4
  },
  {
    slug: "meat-cooking-time",
    name: "Meat Cooking Time Calculator",
    tagline: "Perfect roast times and internal temperatures for every cut.",
    category: "Meat & Seafood",
    icon: "Beef",
    description:
      "Stop guessing when the roast is done. This meat cooking time calculator estimates roasting and grilling times from the weight of your cut and your preferred doneness, and shows the target internal temperature for safe, juicy results.\n\nIt covers chicken, turkey, beef, pork, lamb and fish with resting time built into every recommendation — because a properly rested roast is the difference between dry and perfect.",
    how_to_use:
      "1. Choose the meat type (beef, chicken, pork, turkey, lamb or fish).\n2. Enter the weight of the cut (choose lb or kg).\n3. Pick your doneness for meats that support it.\n4. Read the estimated cooking time and target internal temperature.",
    formula:
      "Roasting follows a simple per-weight rule: each cut needs a set number of minutes per pound (or kilo). The tool multiplies your roast's weight by that rate, then checks the target internal temperature against USDA-recommended safe minimums. It also adds the resting time, because meat keeps cooking after it leaves the oven.",
    code:
      "const BEEF = { rare: { min: 50, max: 52 }, mediumRare: { min: 55, max: 57 }, medium: { min: 60, max: 63 }, well: { min: 71, max: 71 } };\n\nfunction roastTime(weightLb, minutesPerLb) {\n  return weightLb * minutesPerLb; // total minutes\n}",
    faq: [
      {
        q: "Why do I need to rest meat?",
        a: "Resting lets the juices redistribute through the muscle fibers. A large roast should rest 15-20 minutes; a steak, 5 minutes. The internal temperature will also rise 3-5°C during resting, so pull it early."
      },
      {
        q: "What's the safe minimum temperature for chicken?",
        a: "The USDA safe minimum for poultry is 74°C (165°F) measured in the thickest part of the thigh. For whole birds, check the thigh joint, not just the breast."
      },
      {
        q: "Can I use a meat thermometer through the aluminum foil?",
        a: "No — foil insulates. Insert the probe directly into the thickest part of the meat, away from bone, and make sure the tip is fully buried."
      }
    ],
    tips: [
      "Use a probe thermometer with an alarm — the single best upgrade for meat cooking.",
      "Bone-in cuts take 20-30% longer than boneless cuts of the same weight.",
      "Brown the roast first; the oven finishes it. Color equals flavor."
    ],
    meta_title: "Meat Cooking Time Calculator — Roast Times & Temps | CookChase",
    meta_description:
      "Free meat cooking time calculator with internal temperatures for beef, chicken, pork, turkey, lamb and fish. Includes USDA safe temperatures and resting times.",
    featured: 1,
    sort_order: 5
  },
  {
    slug: "baking-pan-converter",
    name: "Baking Pan Converter",
    tagline: "Convert any recipe to a different pan size — adjust ingredients with confidence.",
    category: "Baking",
    icon: "CupSoda",
    description:
      "A recipe written for a 9-inch round cake pan looks very different in a 13×9 sheet pan. This baking pan converter compares the surface area of your original pan and your target pan, then gives you the multiplier to apply to every ingredient.\n\nThe tool supports round, square, rectangular and loaf pans, and explains the bake time adjustments you'll need when the pan is shallower or deeper than the original.",
    how_to_use:
      "1. Choose the shape of your original pan (round, square, rectangle or loaf).\n2. Enter its dimensions in inches or centimeters.\n3. Do the same for the pan you want to use instead.\n4. Read your ingredient multiplier and adjusted bake-time guidance.",
    formula:
      "The tool compares the cooking surface of your two pans. For round pans it uses the circle area (radius squared times pi); for square and rectangular pans it simply multiplies length by width. Dividing the new pan's area by the original pan's area gives the multiplier for every ingredient - and the tool also hints at bake-time changes for shallower or deeper pans.",
    code:
      "function panMultiplier(orig, target) {\n  const area = (p) =>\n    p.shape === 'round' ? Math.PI * (p.d / 2) ** 2 : p.w * p.l;\n  return area(target) / area(orig);\n}",
    faq: [
      {
        q: "Does pan depth matter?",
        a: "Yes. A multiplier assumes the same batter depth. A bigger, shallower pan spreads the batter thinner and bakes faster — check 10-15 minutes early. A deeper pan needs extra time and lower temperature to avoid a burnt crust."
      },
      {
        q: "Can I bake a 2-layer cake recipe in one deep pan?",
        a: "Only if the pan is deep enough — roughly 3 inches. Fill any pan only two-thirds full. If it's too full, bake the extra batter as cupcakes."
      },
      {
        q: "What if I don't have the right pan at all?",
        a: "Use the closest size and watch the time. You can also split the batter into smaller pans and bake them in batches, though you'll need to be quick about it."
      }
    ],
    tips: [
      "Line pans with parchment even when the recipe says 'greased' — it's the cheapest insurance.",
      "Weigh your batter to divide it evenly between layers.",
      "A convection oven browns edges faster; rotate pans halfway through."
    ],
    meta_title: "Baking Pan Size Converter — Adjust Any Recipe | CookChase",
    meta_description:
      "Free baking pan converter. Convert recipes between round, square, rectangular and loaf pans and get the exact ingredient multiplier and bake time advice.",
    featured: 0,
    sort_order: 6
  },
  {
    slug: "nutrition-calculator",
    name: "Recipe Nutrition Calculator",
    tagline: "Estimate calories and macros for any recipe in seconds.",
    category: "Nutrition & Health",
    icon: "Salad",
    description:
      "The Recipe Nutrition Calculator estimates calories, protein, carbs, fat and fiber for your recipe based on a built-in database of 40+ common ingredients. Add your ingredients and serving count, and the tool sums the nutrition per serving.\n\nEstimates are based on USDA-style averages for generic foods. They're accurate enough for everyday tracking, meal planning and food-blog recipe cards.",
    how_to_use:
      "1. Select an ingredient from the searchable list.\n2. Enter the amount in grams.\n3. Add as many ingredients as your recipe needs.\n4. Set the number of servings and read per-serving nutrition instantly.",
    formula:
      "Every ingredient's nutrition is scaled by how much you use: the tool takes the values per 100 grams, multiplies them by your weight in grams, and adds everything up. It then divides the totals by the number of servings, so each row of the result shows what one serving contains.",
    code:
      "const FOODS = { egg: { kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5, fiber: 0 } };\n\nfunction nutritionPerServing(ingredients, servings) {\n  const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };\n  for (const ing of ingredients) {\n    const n = FOODS[ing.food];\n    const f = ing.grams / 100;\n    for (const k of Object.keys(totals)) totals[k] += n[k] * f;\n  }\n  return Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v / servings]));\n}",
    faq: [
      {
        q: "How accurate are the numbers?",
        a: "The values come from USDA-style averages for generic ingredients. They'll typically land within 10-15% of a lab analysis — plenty for meal planning and recipe cards, not enough for medical advice."
      },
      {
        q: "Why do my cooked weights differ from raw weights?",
        a: "Cooking removes water (concentrating calories) or adds fat (oil). We use raw weights, which is the standard approach. If you track food, weigh raw when possible."
      },
      {
        q: "Can I track sodium and sugar too?",
        a: "This free version covers calories, protein, carbs, fat and fiber. The same method extends naturally to sodium and sugar — it's on the roadmap."
      }
    ],
    tips: [
      "Weigh cooked pasta at about 2.5x its dry weight to match a raw serving.",
      "Oil is the sneakiest calorie source — 1 tablespoon of olive oil is ~119 kcal.",
      "Build your own ingredient library and reuse it across meals."
    ],
    meta_title: "Recipe Nutrition Calculator — Calories & Macros | CookChase",
    meta_description:
      "Free recipe nutrition calculator. Estimate calories, protein, carbs, fat and fiber per serving using a built-in ingredient database. Perfect for meal tracking.",
    featured: 1,
    sort_order: 7
  },
  {
    slug: "ingredient-substitution",
    name: "Ingredient Substitution Finder",
    tagline: "Find smart swaps for 80+ ingredients — with ratios and cooking notes.",
    category: "Kitchen Helpers",
    icon: "Repeat",
    description:
      "Out of buttermilk at 7pm? This ingredient substitution finder covers 80+ common ingredients with direct, tested swaps, the right ratio, and a note about how the swap changes the dish.\n\nThe database includes baking staples, dairy, fats, eggs, herbs, acids, sweeteners and gluten-free alternatives — everything a busy home cook runs out of.",
    how_to_use:
      "1. Start typing an ingredient in the search box (e.g. 'buttermilk', 'egg', 'brown sugar').\n2. Read the best substitutes, each with its ratio.\n3. Note the usage tip — some swaps work in baking but not in sauces.",
    formula:
      "Most swaps are about function, not numbers. The tool stores a tested replacement for each ingredient - for example, three-quarters oil instead of butter - and simply applies that ratio to the amount in your recipe. Each entry also tells you when the swap works best, like in baking or in sauces.",
    code:
      "const SUBSTITUTIONS = {\n  buttermilk: [\n    { name: 'Milk + lemon juice', ratio: '1 cup milk + 1 tbsp lemon juice', note: 'Let sit 5 min before using' },\n    { name: 'Yogurt thinned with milk', ratio: '3/4 cup yogurt + 1/4 cup milk', note: 'Best in pancakes & cakes' }\n  ]\n};\n\nfunction findSubstitute(ingredient) {\n  return SUBSTITUTIONS[ingredient.toLowerCase()] ?? [];\n}",
    faq: [
      {
        q: "Can I substitute oil for butter in a cake?",
        a: "Yes, and the cake will actually be more tender and stay moist longer. Use about ¾ the amount of oil (butter is 80% fat; oil is 100%). Melted butter has ~15% water, which also affects the crumb."
      },
      {
        q: "What's the best egg replacement for baking?",
        a: "For binding, a 'flax egg' (1 tbsp ground flaxseed + 3 tbsp water) works well in cookies and muffins. For structure in cakes, applesauce or mashed banana adds moisture. Commercial egg replacers are the most reliable for meringue-like tasks."
      },
      {
        q: "How do I make a quick buttermilk substitute?",
        a: "Add 1 tablespoon of lemon juice or white vinegar to 1 cup of milk and let it sit for 5 minutes. It will curdle slightly — that's exactly what you want for pancakes and cakes."
      }
    ],
    tips: [
      "In baking, weight-for-weight swaps are safer than volume-for-volume.",
      "Sweetness differs between sugars — honey is sweeter than sugar, so reduce liquid and lower the oven slightly.",
      "Save this page — you'll use it at least once a week."
    ],
    meta_title: "Ingredient Substitution Finder — 80+ Smart Swaps | CookChase",
    meta_description:
      "Free ingredient substitution guide for 80+ kitchen staples. Find tested swaps with ratios for dairy, eggs, fats, sweeteners, herbs and more.",
    featured: 1,
    sort_order: 8
  },
  {
    slug: "meal-prep-planner",
    name: "Meal Prep Planner",
    tagline: "Plan a week of meals and generate a combined shopping list.",
    category: "Planners",
    icon: "CalendarDays",
    description:
      "The Meal Prep Planner turns scattered dinner ideas into a real plan. Pick a 5 or 7-day week, choose what you'll cook for breakfast, lunch and dinner, and the planner generates a single combined shopping list grouped by category.\n\nBatch-cook once, and the whole week becomes reheating instead of cooking. The planner is built for real meal preppers — it reminds you which meals can be made ahead and which must be fresh.",
    how_to_use:
      "1. Choose a 5-day or 7-day week.\n2. For each day, pick breakfast, lunch and dinner from your saved meal list.\n3. Add any custom meals you prep regularly.\n4. Generate the combined shopping list and copy or print it.",
    formula:
      "The shopping list is built by adding up the ingredients across every meal you selected, counting each meal by the number of days it appears. Batch-cooked dishes are flagged with the best prep day and how long they will keep, so you know what to cook ahead and what to save for later.",
    code:
      "function buildShoppingList(meals, days) {\n  const list = {};\n  days.forEach((day) => {\n    meals[day].forEach((meal) => {\n      meal.ingredients.forEach((ing) => {\n        list[ing.name] = (list[ing.name] || 0) + ing.amount * meal.servings;\n      });\n    });\n  });\n  return list;\n}",
    faq: [
      {
        q: "How long can meal-prepped food stay in the fridge?",
        a: "Cooked food is generally safe for 3-4 days refrigerated at or below 4°C. If you're prepping for a full 7-day week, freeze the later portions and thaw them in the fridge the night before."
      },
      {
        q: "Should I prep breakfast and dinner, or just dinners?",
        a: "Start with dinner — it's the meal most families fail on weeknights. Once that's on autopilot, add overnight oats for breakfast and your lunch rotation becomes trivial."
      },
      {
        q: "What's the best way to store prepped meals?",
        a: "Glass containers with snap lids stack well and reheat evenly. Portion into single servings before storing, and label with the dish and date."
      }
    ],
    tips: [
      "Plan around one or two versatile proteins used in three different meals.",
      "Buy ingredients with overlapping prep — chop once, use twice.",
      "Keep Friday flexible so leftovers become the fifth dinner."
    ],
    meta_title: "Meal Prep Planner — Weekly Plan & Shopping List | CookChase",
    meta_description:
      "Free meal prep planner for a 5 or 7-day week. Combine meals into one categorized shopping list, plan batch cooking and simplify your weeknights.",
    featured: 1,
    sort_order: 9
  },
  {
    slug: "kitchen-timers",
    name: "Kitchen Multi-Timer",
    tagline: "Run several kitchen timers at once — perfect for multi-dish cooking.",
    category: "Kitchen Helpers",
    icon: "Timer",
    description:
      "Pasta takes 9 minutes, the roast needs another 40, and the dough should rest for 20. The Kitchen Multi-Timer lets you run several timers simultaneously, each with a name, so you never confuse 'which timer was that?' again.\n\nTimers continue counting down, show a visual ring, and play a gentle alarm when done. A summary keeps every active timer visible at a glance.",
    how_to_use:
      "1. Give the timer a name (e.g. 'Pasta').\n2. Set minutes and seconds.\n3. Add as many timers as you need — they all run at once.\n4. Tap any timer to pause or reset it. When a timer finishes, dismiss it with one tap.",
    formula:
      "Each timer simply counts down from the time you set. The app records the moment the timer should finish and keeps subtracting the current time from it - when nothing is left, the alarm sounds. Run several at once and each one stays independent.",
    code:
      "class Timer {\n  constructor(name, seconds) {\n    this.name = name;\n    this.duration = seconds;\n    this.endAt = Date.now() + seconds * 1000;\n  }\n  remaining() {\n    const ms = Math.max(0, this.endAt - Date.now());\n    return Math.ceil(ms / 1000);\n  }\n}\n\nconst timers = [new Timer('Pasta', 9 * 60)];\nsetInterval(() => {\n  timers.forEach((t) => {\n    if (t.remaining() === 0) console.log(t.name + ' is done!');\n  });\n}, 1000);",
    faq: [
      {
        q: "Can I leave the tab and still hear the alarm?",
        a: "Yes — the alarm uses the Web Audio API and plays through your system output. As long as your browser tab stays open in the background, it will sound. Pinning the tab and keeping your volume up is safest."
      },
      {
        q: "Do timers keep running if I close the page?",
        a: "No — timers are in-page. For a backup, use the alarm clock on your phone for the longest single item. The multi-timer excels at juggling several short items at once."
      },
      {
        q: "How accurate is it?",
        a: "Countdown is based on wall-clock time (Date.now), so it doesn't drift. Browser throttling in background tabs can add a second or two for long timers, which is irrelevant in the kitchen."
      }
    ],
    tips: [
      "Name every timer — future you will thank present you.",
      "Set pasta to al dente minus 1 minute and test a piece; brands differ.",
      "Use the ring as a cue to start side dishes, not just to stop the main one."
    ],
    meta_title: "Kitchen Multi-Timer — Run Several Timers at Once | CookChase",
    meta_description:
      "Free kitchen multi-timer. Run multiple named timers at once with visual rings and alarms. Perfect for multi-dish cooking and baking schedules.",
    featured: 1,
    sort_order: 10
  },
  {
    slug: "sous-vide-guide",
    name: "Sous Vide Time & Temperature Guide",
    tagline: "Restaurant-exact sous vide temperatures and times for every protein.",
    category: "Cooking Guides",
    icon: "Waves",
    description:
      "Sous vide is the most forgiving way to cook protein — once you know the right temperature and time. This guide lists precision temperatures for steak, chicken, pork, fish, eggs and vegetables, with the time ranges that give flawless results.\n\nBecause sous vide can't overcook, this tool is really about your target texture: a 54°C ribeye is rosy rare; 60°C is medium. Pick your protein and desired doneness and get the exact numbers.",
    how_to_use:
      "1. Pick your protein (steak, chicken, pork, salmon, eggs, vegetables).\n2. Choose your desired doneness or texture.\n3. Read the exact water temperature and minimum time.\n4. Follow the finish note — a quick sear in a hot pan is non-negotiable for most meats.",
    formula:
      "Sous vide times come from food-science pasteurization tables rather than a simple formula. Thicker cuts need longer for the heat to reach the center - roughly one extra hour for every extra 2.5 centimeters (1 inch) of thickness. The tool combines the minimum safe time with your protein and the doneness you want, and reminds you to sear the outside for flavor.",
    code:
      "const SOUSVIDE = {\n  steak: {\n    rare: { tempC: 52, timeMin: 60, note: 'Sear 60s per side' },\n    medium: { tempC: 58, timeMin: 60, note: 'Sear 60s per side' }\n  },\n  chickenBreast: { tempC: 64, timeMin: 90, note: 'Juicy & safe' },\n  salmon: { tempC: 48, timeMin: 40, note: 'Medium, silky' }\n};\n\nfunction sousVideTime(protein, doneness, thicknessCm) {\n  const base = SOUSVIDE[protein][doneness];\n  return base.timeMin + Math.max(0, thicknessCm - 2.5) * 25;\n}",
    faq: [
      {
        q: "Is sous vide chicken safe at 64°C?",
        a: "Yes. 64°C (147°F) for 90 minutes achieves pasteurization while staying moist — well below the 74°C that makes chicken dry. For whole chicken thighs with bones, use 74°C for shredding texture."
      },
      {
        q: "Why does my steak need a sear if it's already cooked?",
        a: "Sous vide produces a perfectly even interior but no crust. A 60-90 second sear in a screaming-hot pan (or with a torch) adds the Maillard browning that delivers most of the flavor. Dry the surface first — wet meat steams, not sears."
      },
      {
        q: "Can I leave food in the bath longer than the minimum?",
        a: "Within reason, yes — that's the beauty of sous vide. But texture degrades over very long times (meat becomes mealy after many hours). Don't exceed about 2x the minimum for tender cuts."
      }
    ],
    tips: [
      "Season with salt before the bath; herbs and garlic after for a cleaner flavor.",
      "Ice-bath or fridge-chill before searing keeps the interior from cooking past your target.",
      "Eggs: 63°C for 45 minutes gives a perfect jammy yolk."
    ],
    meta_title: "Sous Vide Time & Temperature Guide | CookChase",
    meta_description:
      "Free sous vide time and temperature guide for steak, chicken, pork, salmon, eggs and vegetables. Precision temps and times for perfect results every time.",
    featured: 0,
    sort_order: 11
  },
  {
    slug: "pizza-dough-calculator",
    name: "Pizza Dough Calculator",
    tagline: "Perfect pizza dough every time — scale by number and size of pizzas.",
    category: "Baking",
    icon: "Pizza",
    description:
      "Great pizza starts with a properly proportioned dough. This pizza dough calculator uses baker's percentages to tell you exactly how much flour, water, salt, yeast and olive oil you need for any number of pizzas at any size — including the hydration level that gives you a chewy, puffy Neapolitan-style crust.\n\nIt works for a same-day dough or a 72-hour cold-fermented dough, so you can scale confidently for two pizzas or a full party.",
    how_to_use:
      "1. Enter how many pizzas you want to make.\n2. Enter the dough ball weight you want (250-300 g is standard for a 12-inch pizza).\n3. Set your hydration (65% is a great all-round starting point).\n4. Read the exact weights for flour, water, salt, yeast and oil.",
    formula:
      "Pizza dough uses baker's percentages, where flour is always 100 percent. Water, salt, yeast and oil are each a percentage of the flour weight - a classic recipe is 100% flour, 65% water, 2.5% salt, 0.3% yeast and 2% oil. The tool starts from the total dough weight you want and works backwards to give you exact grams of everything.",
    code:
      "function pizzaDough(pizzas, ballWeight, hydration) {\n  const salt = 0.025, yeast = 0.003, oil = 0.02;\n  const total = pizzas * ballWeight;\n  const flour = total / (1 + hydration + salt + yeast + oil);\n  return {\n    flour: flour,\n    water: flour * hydration,\n    salt: flour * salt,\n    yeast: flour * yeast,\n    oil: flour * oil\n  };\n}",
    faq: [
      {
        q: "What is hydration and why does it matter?",
        a: "Hydration is the water weight as a percentage of flour weight. 60% gives an easy, crisp crust. 65-70% gives an airy, chewy, Neapolitan-style crumb. Beginners should start at 62-65% — wetter dough is stickier and harder to shape."
      },
      {
        q: "How long should the dough ferment?",
        a: "Same-day: 2-4 hours at room temperature. Better: 24-72 hours in the fridge. Cold fermentation develops flavor and structure, and makes the dough easier to handle."
      },
      {
        q: "What yeast should I use?",
        a: "Instant (rapid-rise) yeast is the most forgiving — it needs no proofing. Active dry yeast can be used at 1.25x the instant yeast weight. Fresh yeast runs at 3x."
      }
    ],
    tips: [
      "Bake on a preheated steel or stone at your oven's maximum temperature.",
      "Stretch from the center outward; never roll the dough flat with a pin.",
      "Let the dough come to room temperature for 1 hour before stretching."
    ],
    meta_title: "Pizza Dough Calculator — Baker's Percentages | CookChase",
    meta_description:
      "Free pizza dough calculator using baker's percentages. Get exact flour, water, salt, yeast and oil for any number and size of pizzas, at any hydration.",
    featured: 1,
    sort_order: 12
  },
  {
    slug: "sweetener-converter",
    name: "Sugar & Sweetener Converter",
    tagline: "Swap sugar for honey, maple, stevia or erythritol with correct ratios.",
    category: "Nutrition & Health",
    icon: "Candy",
    description:
      "Replacing sugar in a recipe is never one-for-one — honey is sweeter and adds liquid, stevia is hundreds of times sweeter than sugar, and erythritol bakes differently. This sweetener converter gives you the correct equivalent for honey, maple syrup, agave, stevia, monk fruit, erythritol and more, plus the adjustments you need to make.\n\nUse it to lighten up recipes, bake for a low-sugar household, or just use what's in your pantry.",
    how_to_use:
      "1. Enter the amount of sugar your recipe calls for.\n2. Pick the sweetener you want to use instead.\n3. Read the equivalent amount, plus the liquid or oven adjustments you need to make.",
    formula:
      "Sweeteners differ in how sweet they are, so the tool divides the sugar in your recipe by the substitute's sweetness level to find the right amount - honey is about 25% sweeter than sugar, so you use less. For liquid sweeteners it also reminds you to trim a little liquid from the recipe and lower the oven temperature slightly.",
    code:
      "const SWEETNESS = { honey: 1.25, maple: 1, agave: 1.4, erythritol: 0.7, stevia: 200, monkfruit: 200 };\n\nfunction sweetenerEquivalent(sugarAmount, sweetener) {\n  return sugarAmount / SWEETNESS[sweetener];\n}",
    faq: [
      {
        q: "Is honey sweeter than sugar?",
        a: "Yes — honey is about 25% sweeter than white sugar, so you use less. Because honey is also about 17% water, reduce the other liquid in the recipe by roughly 3 tablespoons per cup of honey swapped in."
      },
      {
        q: "Can I bake with stevia or erythritol?",
        a: "Yes, but the results differ. Erythritol measures and browns like sugar (about 70% as sweet) and is excellent in cookies. Pure stevia has no bulk — it's 200x sweeter — so you need a bulking agent like applesauce or a commercial blend for volume."
      },
      {
        q: "Does maple syrup swap 1:1 for sugar?",
        a: "Maple is roughly as sweet as sugar by taste, so it swaps near 1:1. But it's a liquid, so reduce the recipe's liquid by 2-4 tablespoons per cup and add a pinch of salt to balance the slightly thinner sweetness."
      }
    ],
    tips: [
      "In caramel and candy, avoid liquid sweeteners — they change the chemistry.",
      "Combine a zero-calorie sweetener with a touch of molasses for brown-sugar depth.",
      "Always taste the batter: sweetness perception varies between brands."
    ],
    meta_title: "Sugar & Sweetener Converter — Honey, Stevia & More | CookChase",
    meta_description:
      "Free sugar and sweetener converter. Find exact equivalents for honey, maple syrup, agave, stevia, monk fruit and erythritol with baking adjustments.",
    featured: 0,
    sort_order: 13
  },
  {
    slug: "bread-hydration",
    name: "Bread Hydration Calculator",
    tagline: "Build the perfect dough with baker's percentages — no guesswork.",
    category: "Baking",
    icon: "Wheat",
    description:
      "Professional bakers think in percentages: every ingredient is a percentage of the flour weight. This bread hydration calculator takes your flour amount and desired hydration and computes water, salt, yeast, and dough yield — plus shows you what the dough texture will feel like at that hydration.\n\nFrom a stiff 55% baguette dough to a slack 80% sourdough, this tool removes the arithmetic from bread making.",
    how_to_use:
      "1. Enter the amount of flour your recipe uses (grams is best).\n2. Set the hydration percentage (60-75% is the normal range for most breads).\n3. Set salt and yeast percentages (2% and 1% are good defaults).\n4. Read the water, salt, yeast, total dough weight, and expected texture.",
    formula:
      "In bread-making, flour is always the 100% reference. Hydration simply means the water as a percentage of the flour weight - 65% hydration means the water weighs 65% of the flour. Salt and yeast are small percentages of the flour too. The tool adds all of it together so you know the total dough weight and the texture to expect.",
    code:
      "function breadDough(flour, hydration, saltPct, yeastPct) {\n  const water = flour * hydration;\n  const salt = flour * saltPct;\n  const yeast = flour * yeastPct;\n  return {\n    flour, water, salt, yeast,\n    total: flour + water + salt + yeast\n  };\n}\n// e.g. breadDough(500, 0.70, 0.02, 0.01)",
    faq: [
      {
        q: "What hydration should I start with?",
        a: "62-65% is the sweet spot for a beginner: it's easy to knead and shape, and gives a good open crumb. Push to 70%+ for airy ciabatta once your folding technique is solid."
      },
      {
        q: "Why is my dough soup at 80% hydration?",
        a: "Because 80% is genuinely wet! At that level the dough is managed with stretch-and-folds, not kneading, and floured hands. Use a wet scraper and a long, patient first fold."
      },
      {
        q: "Does bread flour change the hydration I should use?",
        a: "Yes. High-protein bread flour absorbs more water than all-purpose — you can run 2-4% higher hydration with bread flour before the dough becomes unmanageable."
      }
    ],
    tips: [
      "Autolyse (flour + water only, 30 min) improves gluten development for free.",
      "Write your hydration in your recipe notes — you'll thank yourself later.",
      "A wetter dough needs a hotter oven and steam for a blistered crust."
    ],
    meta_title: "Bread Hydration Calculator — Baker's Percentages | CookChase",
    meta_description:
      "Free bread hydration calculator using baker's percentages. Get exact water, salt, yeast and dough weight for any flour amount and hydration level.",
    featured: 1,
    sort_order: 14
  },
  {
    slug: "sourdough-calculator",
    name: "Sourdough Starter Calculator",
    tagline: "Build, feed and maintain your sourdough starter with exact ratios.",
    category: "Baking",
    icon: "Egg",
    description:
      "A healthy sourdough starter is just flour, water and time — but only if you feed it the right ratio. This sourdough starter calculator tells you how much starter, flour and water you need to feed, based on the starter's hydration and the amount you want for your next bake.\n\nIt also covers the common 1:2:2 and 1:5:5 feeding schedules and what each produces, so your starter stays strong whether you bake daily or weekly.",
    how_to_use:
      "1. Enter your starter's hydration (100% = equal parts flour and water by weight).\n2. Enter how much starter you want to end up with.\n3. Choose a feeding ratio (1:1:1 daily, 1:2:2 strong, 1:5:5 weekly).\n4. Read exactly how much starter, flour and water to add.",
    formula:
      "A 100%-hydration starter is equal parts flour and water by weight. Feeding it at a ratio like 1:2:2 means adding twice the starter's weight in fresh flour and the same amount of water. The tool tells you exactly how much starter, flour and water to combine so your starter lands at the weight you want.",
    code:
      "function feedStarter(current, ratio, hydration) {\n  const flour = current * ratio;\n  const water = flour * hydration;\n  return {\n    starter: current,\n    flourToAdd: flour,\n    waterToAdd: water,\n    total: current + flour + water\n  };\n}\n// e.g. feedStarter(50, 2, 1) -> 150g of fresh starter",
    faq: [
      {
        q: "How often should I feed my starter?",
        a: "At room temperature, feed daily (1:1:1 or 1:2:2). In the fridge, a mature starter can go 1-2 weeks between feedings — feed it 1:5:5 the day before you bake to rebuild strength."
      },
      {
        q: "What does 'peak' mean and why does it matter?",
        a: "Peak is when the starter has at least doubled and is domed on top — the moment it's most active. Using starter at peak gives your dough the strongest, fastest rise."
      },
      {
        q: "My starter isn't rising. What's wrong?",
        a: "Most commonly: not warm enough (below 21°C slows activity dramatically), too much hooch (acidity), or a too-high feeding ratio. Move it somewhere warm and feed 1:2:2 twice daily until it reliably doubles."
      }
    ],
    tips: [
      "Discard, don't hoard — a 30 g starter fed at 1:2:2 doubles fast.",
      "A rubber band on the jar marks the starting height; peak is easy to read.",
      "Feed with bread flour for maximum activity; rye adds flavor but ferments faster."
    ],
    meta_title: "Sourdough Starter Calculator — Feeding Ratios | CookChase",
    meta_description:
      "Free sourdough starter calculator. Get exact starter, flour and water amounts for 1:1:1, 1:2:2 and 1:5:5 feeding schedules at any hydration.",
    featured: 0,
    sort_order: 15
  },
  {
    slug: "brine-calculator",
    name: "Brine & Marinade Calculator",
    tagline: "Perfect brine and marinade ratios for turkey, chicken and pork.",
    category: "Meat & Seafood",
    icon: "Droplets",
    description:
      "Brining is the difference between a dry, bland bird and a juicy, seasoned one. This brine and marinade calculator builds a wet or dry brine from the weight of your meat, using food-safe salt percentages, and suggests marinade quantities for your chosen cut.\n\nThe tool supports wet brines (saltwater solution), dry brines (salt rub left overnight) and quick marinades, and it flags the maximum safe brine times so you never oversalt your dinner.",
    how_to_use:
      "1. Enter the weight of your meat.\n2. Choose a wet brine, dry brine or marinade.\n3. For wet brine, pick a salt level (5% is the classic all-purpose ratio).\n4. Read the water, salt, sugar and suggested brine time.",
    formula:
      "A classic 5% wet brine uses salt at 5% of the water's weight. The tool calculates enough water to cover your meat, then works out the salt (and optional sugar) from that amount. Brining time follows a simple rule: about one hour per 500 grams (1 pound) of poultry.",
    code:
      "function wetBrine(meatWeightKg, saltPct = 0.05) {\n  const water = meatWeightKg * 2;       // litres, enough to cover\n  const salt = water * saltPct * 1000;  // grams\n  const sugar = salt * 0.75;\n  const hours = meatWeightKg * 2;       // ~1h per 500g\n  return { water, salt, sugar, hours };\n}",
    faq: [
      {
        q: "Wet brine or dry brine — which is better?",
        a: "Dry brine is simpler and gives crispier skin because the surface stays dry. Wet brine adds more moisture but needs a vessel big enough to submerge the meat. Both transform poultry; choose by space and time."
      },
      {
        q: "How long is too long to brine?",
        a: "Oversalting is the risk. A whole turkey can brine 18-24 hours; a 1.5 kg chicken about 12 hours; chops and breasts just 30-60 minutes. When in doubt, under-brine — you can always season more."
      },
      {
        q: "Do I need to rinse the meat after brining?",
        a: "Rinsing removes excess surface salt but also washes away seasoning. Pat dry instead and adjust your additional salt accordingly — the brine already seasoned the meat throughout."
      }
    ],
    tips: [
      "Pat the meat completely dry after brining for that crackly skin.",
      "Skip the salt in your recipe after brining — the meat is already seasoned.",
      "Add aromatics (peppercorns, bay, citrus) to the brine for flavor, not just salt."
    ],
    meta_title: "Brine & Marinade Calculator — Safe Ratios | CookChase",
    meta_description:
      "Free brine and marinade calculator. Get exact water, salt, sugar and brine times for turkey, chicken and pork using food-safe percentages.",
    featured: 0,
    sort_order: 16
  },
  {
    slug: "food-storage-guide",
    name: "Food Storage & Expiration Guide",
    tagline: "How long does it really last? Searchable shelf-life database.",
    category: "Cooking Guides",
    icon: "Snowflake",
    description:
      "Milk, eggs, herbs, leftovers — how long is that actually safe? This food storage guide is a searchable database of common foods with their fridge, freezer and pantry shelf lives, based on USDA guidelines.\n\nIt separates 'best by' (quality) from 'use by' (safety), and flags the few foods that freeze poorly so you don't waste freezer space on things that turn to mush.",
    how_to_use:
      "1. Type a food into the search box (try 'egg', 'milk', 'chicken', 'pasta').\n2. Read its pantry, fridge and freezer shelf lives.\n3. Check the safety note — most items are governed by quality, not danger.",
    formula:
      "Shelf lives come from USDA and FDA reference tables rather than calculations. The fridge slows bacteria at 4 degrees C or below, and the freezer stops them almost completely - quality fades over time, but safety holds. The basic rule of thumb: no more than 2 hours outside the fridge, or 1 hour on a hot day above 32 degrees C.",
    code:
      "const STORAGE = {\n  egg: { pantry: '2-3 weeks (unwashed, cool)', fridge: '3-5 weeks', freezer: '1 year (raw, out of shell)' },\n  chicken: { pantry: '2 hours', fridge: '1-2 days raw / 3-4 days cooked', freezer: '9-12 months raw' },\n  milk: { pantry: '2 hours', fridge: '5-7 days', freezer: '3 months (texture changes)' }\n};\n\nfunction shelfLife(food) {\n  return STORAGE[food.toLowerCase()] ?? null;\n}",
    faq: [
      {
        q: "Is food safe after the 'best by' date?",
        a: "Usually yes. 'Best by' is a quality marker, not a safety date. 'Use by' is the last day a manufacturer guarantees peak quality. Trust your senses — smell, sight and taste — unless it's a high-risk food like deli meat or raw poultry."
      },
      {
        q: "How long can I keep leftovers?",
        a: "Cooked leftovers are safe in the fridge for 3-4 days, and in the freezer for 2-6 months depending on the dish. Reheat to 74°C and only reheat once — repeated cycles multiply risk."
      },
      {
        q: "Can I eat eggs after the date on the carton?",
        a: "Shell eggs often stay safe 3-5 weeks past the pack date if refrigerated. Do the float test as a fun check, but the real signals are smell and appearance when cracked."
      }
    ],
    tips: [
      "Label leftovers with the date — memory is optimistic.",
      "Freeze herbs in oil in ice cube trays; they last months and go straight into sauces.",
      "Keep the fridge at or below 4°C with a thermometer."
    ],
    meta_title: "Food Storage & Expiration Guide — Shelf Life Database | CookChase",
    meta_description:
      "Free food storage guide. Search shelf lives for pantry, fridge and freezer for 60+ foods based on USDA guidelines, with safety notes and freezing tips.",
    featured: 1,
    sort_order: 17
  },
  {
    slug: "caffeine-calculator",
    name: "Caffeine Calculator",
    tagline: "How much caffeine are you really drinking? Track your daily intake.",
    category: "Drinks",
    icon: "Coffee",
    description:
      "Your morning coffee is a moving target: espresso, drip, cold brew and tea all deliver wildly different caffeine levels. This caffeine calculator estimates the caffeine in coffee, tea, energy drinks and sodas based on drink type and size, and sums your daily total against safe intake guidelines.\n\nKnow what a 'cup of coffee' really contains — and how close you are to the 400 mg daily guideline most healthy adults can consume.",
    how_to_use:
      "1. Add a drink: choose the type (drip coffee, espresso, tea, energy drink, soda).\n2. Enter the size in ml or oz.\n3. Add every drink you have in a day.\n4. Read your estimated total caffeine and how it compares to the 400 mg guideline.",
    formula:
      "Each drink type has a typical amount of caffeine per volume - drip coffee averages about 95 mg per 240 ml cup, espresso about 63 mg per shot. The tool multiplies the size of each drink by its average and adds up your daily total, then compares it with the 400 mg guideline for healthy adults.",
    code:
      "const CAFFEINE = {\n  drip: 0.396, espresso: 2.1, coldBrew: 0.67,\n  blackTea: 0.196, greenTea: 0.117, energy: 0.118, cola: 0.096\n};\n\nfunction caffeine(volumeMl, type) {\n  return volumeMl * CAFFEINE[type];\n}",
    faq: [
      {
        q: "How much caffeine is too much?",
        a: "The FDA suggests up to 400 mg per day for healthy adults (about 4 cups of coffee). Sensitivity varies — pregnant people are advised to cap at 200 mg, and 600+ mg raises the risk of sleep, anxiety and heart-rhythm issues."
      },
      {
        q: "Why does cold brew have more caffeine than drip?",
        a: "Cold brew uses a much higher coffee-to-water ratio and a long steep, so it's more concentrated. By the cup, cold brew can have 1.5-2x the caffeine of drip coffee."
      },
      {
        q: "Does decaf really have zero caffeine?",
        a: "Almost — decaf still contains about 2-5 mg per cup, roughly 3% of regular. It's a real choice for the caffeine-sensitive, just not a completely caffeine-free one."
      }
    ],
    tips: [
      "Espresso drinks (lattes, cappuccinos) have similar caffeine to their shots, not their volume.",
      "Caffeine peaks in blood about 30-60 minutes after drinking and lingers for 5-6 hours.",
      "If caffeine disrupts your sleep, switch to decaf after noon."
    ],
    meta_title: "Caffeine Calculator — Daily Intake Tracker | CookChase",
    meta_description:
      "Free caffeine calculator. Estimate caffeine in coffee, espresso, tea, energy drinks and soda, and compare your daily total against the 400 mg guideline.",
    featured: 0,
    sort_order: 18
  },
  {
    slug: "alcohol-cookoff",
    name: "Alcohol Evaporation Calculator",
    tagline: "How much alcohol actually remains after cooking?",
    category: "Drinks",
    icon: "Flame",
    description:
      "Flambéing a pan doesn't burn off all the alcohol — and neither does a long simmer. This alcohol evaporation calculator uses USDA data to show how much alcohol remains after different cooking methods, so you can make informed choices for yourself, kids and guests who avoid alcohol.\n\nThe truth surprises people: a dish simmered for 15 minutes still holds about 40% of its alcohol. Only a long, slow braise gets close to negligible amounts.",
    how_to_use:
      "1. Enter the volume of alcohol the recipe uses (wine, beer, spirits).\n2. Enter the alcohol percentage (wine 12%, beer 5%, spirits 40%).\n3. Choose the cooking method and duration.\n4. Read the alcohol remaining in grams and equivalent shots.",
    formula:
      "The tool uses USDA retention factors - measured values for how much alcohol survives different cooking methods. A quick flambe leaves roughly 25% behind, while a long 2.5-hour simmer drops it to about 5%. The tool multiplies the alcohol in your recipe by the factor for the method and time you chose.",
    code:
      "const RETENTION = {\n  'flambe-0': 0.25, 'bake-15': 0.45, 'simmer-15': 0.4,\n  'simmer-30': 0.35, 'simmer-60': 0.25, 'simmer-150': 0.05\n};\n\nfunction alcoholLeft(volumeMl, abv, method) {\n  const alcoholMl = volumeMl * abv;\n  return alcoholMl * RETENTION[method];\n}",
    faq: [
      {
        q: "Does flambéing remove all the alcohol?",
        a: "No. A flambé lasts seconds and burns off only about 25% of the alcohol. The visual flame is dramatic, but the chemistry is modest."
      },
      {
        q: "How long do I need to cook to remove alcohol?",
        a: "To get below about 5% retention you need roughly 2.5 hours of simmering. Even then, the dish isn't truly alcohol-free — that generally requires about 4 hours of cooking."
      },
      {
        q: "Are these numbers safe for kids?",
        a: "They're data from USDA tables, not safety advice. If you're serving children or people avoiding alcohol, treat any retention above trace levels as meaningful and choose a no-alcohol swap instead."
      }
    ],
    tips: [
      "For a true no-alcohol result, replace wine with stock plus a splash of vinegar.",
      "Keep the lid off while simmering — covering the pan cuts evaporation dramatically.",
      "The stronger the drink, the more alcohol survives per unit of cooking time."
    ],
    meta_title: "Alcohol Evaporation Calculator — After Cooking | CookChase",
    meta_description:
      "Free alcohol evaporation calculator using USDA retention data. See how much alcohol remains after flambéing, simmering, baking or slow-cooking.",
    featured: 0,
    sort_order: 19
  },
  {
    slug: "water-intake",
    name: "Daily Water Intake Calculator",
    tagline: "Find your ideal daily water target in liters and cups.",
    category: "Nutrition & Health",
    icon: "CupSoda",
    description:
      "Hydration needs aren't one-size-fits-all. This daily water intake calculator estimates your daily target from body weight, activity level and climate, and converts the result into liters, milliliters and cups so you can actually measure it.\n\nIt uses the widely cited formula of 30-35 ml per kilogram of body weight, adjusted upward for exercise and heat — a practical starting point that most healthy adults can tailor from there.",
    how_to_use:
      "1. Enter your body weight (choose kg or lb).\n2. Select your activity level (sedentary to very active).\n3. Select your climate (mild, hot, very hot).\n4. Read your daily water target in liters, milliliters and cups.",
    formula:
      "Your daily water target starts from a simple body-weight baseline: about 30 milliliters per kilogram. The tool then adds 350 ml for every 30 minutes of exercise and extra for hot climates, giving you a total in liters and cups that is realistic for your day.",
    code:
      "function waterTarget(weightKg, activityMin, climate) {\n  const climateExtra = { mild: 0, hot: 300, veryHot: 600 }[climate];\n  const activityExtra = Math.floor(activityMin / 30) * 350;\n  const baseline = weightKg * 30;\n  return baseline + activityExtra + climateExtra; // ml\n}",
    faq: [
      {
        q: "Is the '8 glasses a day' rule wrong?",
        a: "Not wrong, just imprecise. The 8×8 rule (about 1.9 liters) is a reasonable floor for many adults, but larger, more active people in hot climates need noticeably more. Your urine color is the best daily check — pale straw is the goal."
      },
      {
        q: "Do coffee and tea count toward my water intake?",
        a: "Yes. Despite the mild diuretic effect, coffee and tea are mostly water and count toward your total. Caffeinated drinks contribute nearly as much hydration as plain water for regular consumers."
      },
      {
        q: "Can I drink too much water?",
        a: "It's rare, but endurance athletes can over-hydrate and dilute sodium (hyponatremia). Aim to drink to thirst plus a little, and replace electrolytes during long sweaty sessions."
      }
    ],
    tips: [
      "Drink a glass of water before every meal — it aids portion control.",
      "Keep a marked bottle: a 1L bottle filled twice hits most targets.",
      "In summer, add 1-2 glasses after outdoor activity even if you don't feel thirsty."
    ],
    meta_title: "Daily Water Intake Calculator — Hydration Target | CookChase",
    meta_description:
      "Free daily water intake calculator. Find your ideal hydration target in liters and cups based on body weight, activity level and climate.",
    featured: 0,
    sort_order: 20
  },
  {
    slug: "pressure-cooker-converter",
    name: "Pressure Cooker Time Converter",
    tagline: "Cook anything in a pressure cooker — exact times, release methods and weight adjustments.",
    category: "Cooking Guides",
    icon: "CookingPot",
    description:
      "The Pressure Cooker Time Converter turns vague 'cook until tender' instructions into a precise plan. Pick what you're cooking, enter the weight, and get the exact minutes at high pressure, the correct release method, and the estimated total time including pressurizing and release.\n\nPressure cooking works by trapping steam to raise the boiling point to about 121°C (250°F) at 15 psi — roughly a third faster than braising. Because the temperature is fixed, the variables that matter are the size of your pieces, the weight of the meat, and whether you release pressure quickly or slowly.",
    how_to_use:
      "1. Choose what you are cooking from the list (chicken, beef, beans, rice and more).\n2. Enter the weight in grams — the time scales with the weight.\n3. Read the minutes at HIGH pressure and the release method.\n4. Use the estimated total time to plan the rest of your meal.",
    formula:
      "For most foods, pressure-cooker time scales with weight: the tool takes the base minutes for the food you picked and adjusts them by the ratio of your weight to the reference weight. A few foods - rice, eggs, vegetables - use a fixed time instead. It also adds the time to build pressure and the release time, so the total is realistic for planning.",
    code:
      "const FOODS = {\n  chickenBreast: { baseMin: 8, baseGrams: 500, fixed: false },\n  whiteRice: { baseMin: 4, baseGrams: 0, fixed: true }\n};\n\nfunction pressureTime(food, weightGrams) {\n  const f = FOODS[food];\n  return f.fixed\n    ? f.baseMin\n    : Math.round((f.baseMin * weightGrams) / f.baseGrams);\n}",
    faq: [
      {
        q: "Should I use quick release or natural release?",
        a: "Foods that foam or overcook fast — vegetables, chicken breast, seafood — need quick release so they don't overcook. Tough cuts like beef chuck, pork shoulder and beans benefit from 10-15 minutes of natural release, which lets the fibers relax and keeps the meat juicy."
      },
      {
        q: "Do I need to adjust times for altitude?",
        a: "Yes. Pressure cookers rely on atmospheric pressure, so above about 1,000 m (3,300 ft) you should add roughly 5% cook time for every 300 m of additional altitude to get the same result."
      },
      {
        q: "Why does my cooker take 12 extra minutes before it even starts?",
        a: "That's the 'come to pressure' phase — the cooker is heating, building steam and reaching 15 psi. It's normal, it's not cooking time, and it's why total time always looks longer than the cook minutes."
      }
    ],
    tips: [
      "Brown meat in the open pot before pressure cooking for deeper flavor.",
      "Never fill the pot past the max line — most recipes work best at 2/3 full.",
      "For liquids: use at least 1 cup, otherwise the cooker can't build pressure.",
      "Use this tool with the Meat Cooking Time calculator to double-check doneness."
    ],
    meta_title: "Pressure Cooker Time Converter — Exact Times & Release Methods | CookChase",
    meta_description:
      "Free pressure cooker time converter: exact high-pressure minutes, release methods and weight adjustments for chicken, beef, beans, rice and more.",
    featured: 1,
    sort_order: 21
  },
  {
    slug: "weekly-menu-generator",
    name: "Weekly Dinner Menu Generator",
    tagline: "Instant 7-day dinner plan with balanced proteins, cook times and no repeats.",
    category: "Meal Planning",
    icon: "CalendarDays",
    description:
      "Stuck on 'what's for dinner'? The Weekly Dinner Menu Generator builds a full 7-night plan in one click from a library of family-friendly recipes. Every generated week avoids repeating the same protein two nights in a row, shows cook time at a glance, and marks which meals are batch-ready so you can cook once and eat twice.\n\nLock any day you love, then regenerate the rest — the generator keeps your locked meals and reshuffles the others. It's the fastest way to turn 'we have nothing to eat' into a plan that fits your week.",
    how_to_use:
      "1. Click 'Generate new week' to build a fresh 7-day plan.\n2. Scan the protein tags to keep the week balanced.\n3. Click 'Lock' on any meal you want to keep.\n4. Regenerate and only the unlocked days change.\n5. Use the Meal Prep Planner to build the shopping list.",
    formula:
      "The generator builds your week from a library of meals, with one simple rule: no two nights in a row use the same protein. That keeps the week varied and balanced without any thinking on your part. Every meal is tagged with its cook time, so you can see which nights need a head start.",
    code:
      "function pickWeek(mealPool) {\n  const picked = [];\n  const pool = shuffle(mealPool);\n  let i = 0;\n  while (picked.length < 7 && i < pool.length * 3) {\n    const candidate = pool[i % pool.length];\n    const prev = picked[picked.length - 1];\n    if (!prev || prev.protein !== candidate.protein) {\n      picked.push(candidate);\n    }\n    i++;\n  }\n  return picked.slice(0, 7);\n}",
    faq: [
      {
        q: "Will I get the same week twice?",
        a: "Almost never. The generator shuffles a library of 24 meals, so every click produces a different combination — while the no-repeated-protein rule keeps every week balanced."
      },
      {
        q: "How do I turn this into a shopping list?",
        a: "Open the Meal Prep Planner tool and add each meal from your generated week. It groups the ingredients across all meals and produces one consolidated shopping list."
      },
      {
        q: "The plan says 'slow' for cook time — what does that mean?",
        a: "It means the recipe needs 90+ minutes (like a pot roast or a roast chicken). We flag those so you know to start them early, or to swap that day for a quick meal."
      }
    ],
    tips: [
      "Lock weekends early — those are the nights you're most likely to commit.",
      "Use the batch-ready tag to cook one big meal and cover two nights.",
      "Pair the plan with the Recipe Scaler when you need to cook for more people.",
      "Keep 2-3 'quick' meals in rotation for nights when life gets busy."
    ],
    meta_title: "Weekly Dinner Menu Generator — 7-Night Meal Plans in One Click | CookChase",
    meta_description:
      "Free weekly dinner menu generator: instant balanced 7-day meal plans with cook times, protein variety and batch-ready tags. Regenerate or lock your favorites.",
    featured: 1,
    sort_order: 22
  },
  {
    slug: "dough-batch-converter",
    name: "Dough Batch Calculator",
    tagline: "Build any bread recipe to a target dough weight using baker's percentages.",
    category: "Baking",
    icon: "Wheat",
    description:
      "The Dough Batch Calculator works like a professional baker's formula. Instead of guessing how much dough you need for one loaf, enter the total dough weight you want, choose your hydration, salt percentage and how much whole wheat to blend in — and the calculator returns exact grams of flour, water and salt.\n\nBaker's math keeps every ingredient relative to the total flour weight (100%), which makes scaling a formula effortless. A 70% hydration dough at 1,000 g total is a completely different (and correct) recipe than a 65% one, and the tool shows you exactly what changed.",
    how_to_use:
      "1. Enter the total dough weight you want (e.g. 1,000 g for two loaves).\n2. Set hydration — 65% is a sturdy loaf, 75% is open and airy.\n3. Set salt at the standard 2% (baker's percentage).\n4. Slide the whole wheat share to blend flours.\n5. Copy the formula and start mixing.",
    formula:
      "In baker's math, flour is always 100% and every other ingredient is a percentage of it. If you want 1,000 grams of dough at 70% hydration with 2% salt, the tool calculates the flour that makes those percentages add up, then derives the exact water and salt. It also splits the flour if you are blending in whole wheat.",
    code:
      "function doughFormula(targetGrams, hydrationPct, saltPct) {\n  const totalPct = 100 + hydrationPct + saltPct;\n  const flour = (targetGrams * 100) / totalPct;\n  return {\n    flour: flour,\n    water: (flour * hydrationPct) / 100,\n    salt: (flour * saltPct) / 100\n  };\n}",
    faq: [
      {
        q: "Why does a higher hydration dough need less flour?",
        a: "Because the flour is the '100%' everything else is measured against. At 75% hydration, water is 75% of the flour weight, so more of the total weight is water — and the dough will be wetter, stickier and produce a more open crumb."
      },
      {
        q: "How much dough do I need for one loaf?",
        a: "A standard 9x5 inch loaf pan holds about 900-1,000 g of dough. A free-form boule from 500-700 g of dough gives a nice round loaf. Use the Baking Pan Converter to match volume to pan size."
      },
      {
        q: "What's a good whole wheat percentage for a beginner?",
        a: "Start at 20-30%. Going 100% whole wheat makes the dough thirsty — you'll want to bump hydration up 5% or so to keep the crumb soft."
      }
    ],
    tips: [
      "Weigh everything — this tool outputs grams for a reason.",
      "Keep hydration between 65-70% on your first tries; it's the friendliest range.",
      "Add the water, mix, rest 20-30 minutes, then add salt for better gluten development.",
      "Use with the Sourdough Calculator to build a leavened version of this formula."
    ],
    meta_title: "Dough Batch Calculator — Baker's Percentages Made Easy | CookChase",
    meta_description:
      "Free dough batch calculator: get exact grams of flour, water and salt for any target dough weight and hydration using professional baker's math.",
    featured: 0,
    sort_order: 23
  },
  {
    slug: "frying-temperature",
    name: "Deep Frying Temperature Guide",
    tagline: "Perfect frying temperatures for 12 foods — with an instant °F / °C converter.",
    category: "Cooking Guides",
    icon: "Flame",
    description:
      "Deep frying is a temperature game. Too cold and the food soaks up oil like a sponge; too hot and the outside burns before the inside cooks. The Deep Frying Temperature Guide lists the exact oil temperatures for 12 common foods — from chicken to churros to tempura — and includes an instant Fahrenheit/Celsius converter so you can set your thermometer without doing math.\n\nEvery entry includes a practical note, like the two-stage method for french fries (blanch at 325°F, finish at 375°F) that gives you crispy fries that aren't greasy.",
    how_to_use:
      "1. Look up your food in the temperature table.\n2. Use the converter to set your thermometer in °F or °C.\n3. Fry in small batches so the oil temperature doesn't crash.\n4. Let the oil come back up to temperature between batches.",
    formula:
      "The converter uses the standard temperature formulas: from Celsius, multiply by 9, divide by 5, then add 32 to get Fahrenheit - and reverse the steps to go back. Most foods fry best between 325 degrees F and 375 degrees F, and the guide lists the ideal temperature for each food, from chicken to churros.",
    code:
      "function toF(c) { return (c * 9) / 5 + 32; }\nfunction toC(f) { return ((f - 32) * 5) / 9; }\n\nconst FRIES = { blanch: toC(325), finish: toC(375) };\nconst CHICKEN = toC(350); // until internal 74°C/165°F",
    faq: [
      {
        q: "What's the ideal temperature for french fries?",
        a: "Use two stages: blanch the cut potatoes at 325°F (163°C) until soft but not colored, drain, then finish at 375°F (190°C) until golden and crisp. This gives fluffy centers and crunchy exteriors."
      },
      {
        q: "How do I know the oil is at temperature without a thermometer?",
        a: "A cube of bread dropped into the oil will brown in about 60 seconds at 350°F and in about 40 seconds at 375°F. A wooden chopstick tip that sizzles steadily also signals roughly 350-375°F."
      },
      {
        q: "Why do my fried foods come out greasy?",
        a: "Greasy food usually means the oil wasn't hot enough, the pan was overcrowded, or the food carried too much moisture. Fry in small batches and pat food dry before battering."
      }
    ],
    tips: [
      "Use a clip-on deep-fry thermometer — it's the only reliable way.",
      "Keep oil between batches; let it climb back to temperature before adding more.",
      "Drain on a wire rack, not paper towels, to keep the crust crisp.",
      "Reuse frying oil 3-5 times, filtering it after each use and storing it away from light."
    ],
    meta_title: "Deep Frying Temperature Guide — Temps for 12 Foods | CookChase",
    meta_description:
      "Deep frying temperatures for chicken, fries, doughnuts, tempura and more — plus an instant °F/°C converter and pro tips for crispy results.",
    featured: 0,
    sort_order: 24
  },
  {
    slug: "egg-timer",
    name: "Perfect Egg Timer",
    tagline: "Soft, jammy or hard — count down the exact boil time for the egg you want.",
    category: "Cooking Guides",
    icon: "Egg",
    description:
      "The Perfect Egg Timer takes the guesswork out of boiling eggs. Choose your style — soft-boiled with a runny yolk, medium with a jammy center, or hard-boiled for sandwiches — and the timer counts down the exact minutes. Add your elevation and the tool automatically extends the time, because water boils at a lower temperature up in the mountains.\n\nThe timer starts from the moment the water is boiling, which is the only honest way to time an egg. When it finishes, a quick ice bath stops the cooking instantly for perfectly consistent yolks.",
    how_to_use:
      "1. Choose your style: soft (6 min), medium (8 min) or hard (11 min).\n2. Enter your elevation in meters if you're above 3,000 m.\n3. Bring water to a rolling boil, then drop in the eggs.\n4. Press 'Start timer' the moment the water returns to a boil.\n5. Ice-bath for 30 seconds when done for perfect peeling.",
    formula:
      "The timer uses proven boiling times per style, counted from the moment the water boils: 6 minutes for soft-boiled, 8 for a jammy center, and 11 for hard-boiled. If you live above 3,000 meters, water boils at a lower temperature, so the tool adds one minute for every 3,000 meters to keep your yolks consistent.",
    code:
      "function eggTime(style, elevationMeters) {\n  const base = { soft: 6, medium: 8, hard: 11 }[style];\n  const bonus =\n    (elevationMeters >= 3000 ? 1 : 0) +\n    (elevationMeters >= 6000 ? 1 : 0) +\n    (elevationMeters >= 9000 ? 1 : 0);\n  return (base + bonus) * 60; // seconds\n}",
    faq: [
      {
        q: "Should the timer start when the water boils or when I add the eggs?",
        a: "Start it the moment the water returns to a rolling boil after adding the eggs. Timing from cold water gives wildly inconsistent results because heating speed varies from stove to stove."
      },
      {
        q: "How do I get eggs that peel easily?",
        a: "Use slightly older eggs (5-10 days old), then shock them in an ice bath for 30 seconds right after cooking. Rolling the egg gently on the counter before peeling also helps the shell release."
      },
      {
        q: "Does altitude really change egg timing?",
        a: "Yes. Above 3,000 m, water boils below 90°C (194°F), so eggs need extra time to set. The timer adds one minute per 3,000 m of elevation automatically."
      }
    ],
    tips: [
      "Start eggs from room temperature to reduce cracking.",
      "A pinch of salt or baking soda in the water makes peeling easier.",
      "For ramen eggs, marinate soft-boiled eggs in soy sauce + mirin overnight.",
      "Use this with the Kitchen Multi-Timer when cooking several batches."
    ],
    meta_title: "Perfect Egg Timer — Soft, Jammy & Hard-Boiled Times | CookChase",
    meta_description:
      "Free perfect egg timer: exact boil times for soft, medium and hard-boiled eggs, with altitude adjustment and a live countdown.",
    featured: 0,
    sort_order: 25
  },
  {
    slug: "recipe-comparator",
    name: "Recipe Comparator",
    tagline: "Put up to three recipes head-to-head: time, cost, servings and nutrition side by side.",
    category: "Planners",
    icon: "ArrowLeftRight",
    description:
      "Two recipes, one decision. The Recipe Comparator lets you enter two dishes and compares them on the things that actually decide what you cook tonight: total time, cost per serving, how many people it feeds, and the nutrition per plate.\n\nEach recipe gets its own panel — name it, set the servings and prep/cook minutes, then add the ingredients with what you paid and the package size. The tool works out each dish's cost per ingredient (price divided by package size, times the amount) and its calories, protein, carbs, fat and fiber using USDA-style averages.\n\nThe comparison table shows every metric side by side with a clear 'A wins' or 'B wins' badge — lower time and cost win, higher protein and fiber win, and anything context-dependent (carbs, serving count) is left neutral. A final verdict counts the categories so you can see the overall picture at a glance.",
    how_to_use:
      "1. Give each recipe a name and set its servings, prep time and cook time.\n2. Add ingredients: pick the food, enter the amount in grams, the price you paid, and the package size in grams.\n3. Read each panel's totals (time, cost, per-serving price) instantly.\n4. Scroll to the comparison table to see every metric side by side with the winner highlighted.\n5. Use the verdict at the bottom to make the call — or let your craving decide.",
    formula:
      "Each ingredient's cost is what you paid divided by the package size, multiplied by the amount you use - so a $2.40 bag of rice (1000 g) that the recipe uses 200 g of costs $0.48. Nutrition comes from per-100-gram averages for each food, scaled by the amount you add. Time is simply prep plus cook. Everything is divided by the number of servings for the per-plate numbers, then the tool compares the two recipes and flags the better value on each row.",
    code:
      "function compareRecipes(a, b) {\n  const cost = (r) =>\n    r.ingredients.reduce((sum, ing) =>\n      sum + (ing.amount / ing.packageSize) * ing.price, 0) / r.servings;\n  const time = (r) => r.prep + r.cook;\n  return {\n    cheaper: cost(a) < cost(b) ? a.name : b.name,\n    faster: time(a) < time(b) ? a.name : b.name\n  };\n}",
    faq: [
      {
        q: "How accurate is the nutrition comparison?",
        a: "Nutrition uses USDA-style averages per 100 g of raw food, the same source as our Nutrition Calculator. Values are typically within 10-15% of a lab analysis — plenty for comparing two recipes, not for medical precision."
      },
      {
        q: "What if my recipe uses cups or ounces instead of grams?",
        a: "Run the amounts through the Kitchen Unit Converter first to get grams, then enter them here. Grams keep the cost and nutrition math consistent."
      },
      {
        q: "Why doesn't the tool pick an overall winner for every recipe pair?",
        a: "Some metrics are preferences, not wins — carbs and serving count depend on your goals and who you're feeding. The tool only crowns a winner on objective measures (time, cost, calories, fat, protein, fiber) and leaves the rest as neutral notes."
      },
      {
        q: "Can I compare a homemade dish against a takeout estimate?",
        a: "Yes — fill one panel with your recipe and the other with your best guess at the takeout version (rough ingredient weights and a price). It's a great way to see the cost and nutrition gap you're actually paying for."
      }
    ],
    tips: [
      "Use the same package sizes you actually pay — bulk-bought staples often flip the cost comparison.",
      "Compare a quick weekday meal against a weekend project to see what the extra time really buys.",
      "For meal prep, the winner on cost-per-serving plus protein usually wins the week.",
      "Pair with the Recipe Cost Calculator for a deeper breakdown of either recipe.",
      "Nutrition is per serving — multiply by servings for whole-batch totals."
    ],
    meta_title: "Recipe Comparator — Compare Time, Cost & Nutrition | CookChase",
    meta_description:
      "Free recipe comparator: put two recipes side by side and compare total time, cost per serving, servings and per-plate nutrition. See which dish wins.",
    featured: 1,
    sort_order: 26
  },
  {
    slug: "coffee-espresso-calculator",
    name: "Coffee & Espresso Calculator",
    tagline: "Get the perfect coffee-to-water ratio for any brew method — or a precise espresso shot.",
    category: "Drinks",
    icon: "Coffee",
    description:
      "The difference between good coffee and great coffee is almost always the ratio. This coffee and espresso calculator shows you the exact coffee-to-water ratio for pour-over, drip machines, French press, moka pot and cold brew — and builds a precise espresso recipe from your dose, shot style and shot count.\n\nEnter the coffee you plan to use and the water you have, and the tool instantly tells you whether your brew is balanced, too weak or too strong — then points you to the ratio range that method actually wants. For espresso, pick ristretto, normale or lungo and the tool computes the exact yield for every shot.",
    how_to_use:
      "1. Pick your brew method: espresso, pour-over, drip, French press, moka or cold brew.\n2. For brewed coffee, enter your coffee in grams and your water in milliliters.\n3. Read your ratio (1:x) and whether it's in the sweet spot for that method.\n4. For espresso, choose ristretto/normale/lungo, set your dose per shot and the number of shots.\n5. Use the quick-ratio guide table to dial in any method from scratch.",
    formula:
      "The brew ratio is the water weight divided by the coffee weight - a 20 g dose with 320 ml of water is a 1:16 ratio. Each method has a recommended band (pour-over and drip sit around 1:15-1:17, French press 1:12-1:15, cold brew 1:8-1:12), and the tool flags when you're outside it. Espresso styles are defined by their dose-to-yield ratio: ristretto is roughly 1:1.5, normale 1:2 and lungo 1:3 - so the tool multiplies your dose by the style's ratio to give the exact yield.",
    code:
      "function brewRatio(coffeeG, waterMl) {\n  return {\n    ratio: (waterMl / coffeeG).toFixed(1),\n    balanced: coffeeG > 0 &&\n      waterMl / coffeeG >= 15 && waterMl / coffeeG <= 17\n  };\n}\n\nconst espressoStyle = { ristretto: 1.5, normale: 2, lungo: 3 };\nconst yieldMl = (dose, style) => dose * espressoStyle[style];",
    faq: [
      {
        q: "Is the ratio measured by weight or volume?",
        a: "By weight, always. A kitchen scale removes the biggest variable in coffee brewing: scoop density changes with bean size and roast. Once you weigh, the same ratio gives you the same cup every single day."
      },
      {
        q: "What's the golden ratio for drip coffee?",
        a: "The specialty-coffee standard is about 60 g of coffee per liter of water — that's a 1:16.7 ratio. Most drip machines perform best between 1:15 and 1:18, so the tool flags anything outside that band."
      },
      {
        q: "Why does my espresso taste sour one day and bitter the next?",
        a: "For a fixed dose, a 1:2 shot that runs under 25 seconds is usually sour (under-extracted) and over 30 seconds bitter (over-extracted). Aim for 25-30 seconds and adjust your grind first, dose second."
      },
      {
        q: "How strong is cold brew compared to regular coffee?",
        a: "Cold brew concentrate is typically brewed at 1:8 to 1:12, making it far stronger than drip — that's why you dilute it with water or milk before drinking. Its lower acidity also makes it taste smoother."
      }
    ],
    tips: [
      "Weigh your beans after grinding — the scale is the real secret to consistency.",
      "For pour-over, bloom the grounds with twice their weight in water for 30 seconds first.",
      "Grind coarser for French press and cold brew, finer for espresso and moka.",
      "Freshly roasted beans need a slightly coarser grind than older ones.",
      "Pair this with the Caffeine Calculator to know what your cup actually delivers."
    ],
    meta_title: "Coffee & Espresso Calculator — Brew Ratios & Shot Recipes | CookChase",
    meta_description:
      "Free coffee and espresso calculator. Get the ideal coffee-to-water ratio for pour-over, drip, French press, moka and cold brew — plus exact espresso shot recipes.",
    featured: 1,
    sort_order: 27
  },
  {
    slug: "grams-cups-converter",
    name: "Grams ↔ Cups Kitchen Converter",
    tagline: "Convert grams to cups, tablespoons and teaspoons — ingredient by ingredient.",
    category: "Kitchen Helpers",
    icon: "Scale",
    description:
      "One cup of flour weighs 125 g; one cup of honey weighs 340 g. That's why a generic 'cup equals 240 grams' shortcut ruins recipes. This grams-to-cups converter uses a built-in density table of 50+ common kitchen ingredients so the conversion is actually right for what you're measuring.\n\nConvert volume to weight (cups, tablespoons or teaspoons to grams) or weight back to volume (grams to cups). The tool shows the full equivalence in cups, tablespoons and teaspoons, so you can work with whatever measuring tools you have on hand.",
    how_to_use:
      "1. Pick your ingredient from the density list (flour, sugar, butter, honey, oats, etc.).\n2. Choose the direction: Cups → Grams or Grams → Cups.\n3. Enter your amount and unit.\n4. Read the converted weight (or volume) plus the full cups/tbsp/tsp equivalents.\n5. Use the swap button to flip direction and convert back.",
    formula:
      "Every ingredient in the table has a grams-per-cup density measured at the standard US cup size (236.6 ml). To convert cups to grams, multiply the number of cups by the density; to convert grams to cups, divide. A cup holds 16 tablespoons and 48 teaspoons, so spoon amounts scale by those factors from the same density.",
    code:
      "const DENSITY = { 'all-purpose flour': 125, 'granulated sugar': 200, butter: 227 };\n\nfunction cupsToGrams(cups, ingredient) {\n  return cups * DENSITY[ingredient];\n}\nfunction gramsToCups(grams, ingredient) {\n  return grams / DENSITY[ingredient];\n}",
    faq: [
      {
        q: "Why does 1 cup of flour weigh less than 1 cup of sugar?",
        a: "Density. Flour particles are light and trap air, so 125 g fills a cup; sugar granules are heavier and pack tighter, so a cup is 200 g. Weight is the only honest comparison between different ingredients."
      },
      {
        q: "Should I use the same grams-per-cup as a baking website?",
        a: "Different sources standardize slightly differently (120 g vs 125 g per cup of flour is common). Pick one standard and stick with it — consistency matters more than which 5 g you choose."
      },
      {
        q: "How do I measure packed brown sugar?",
        a: "The density table assumes brown sugar is packed firmly into the cup — that's how recipes mean it. Unpacked brown sugar can be 15-20% lighter, so pack it down for consistent results."
      },
      {
        q: "Does altitude change these conversions?",
        a: "Humidity changes flour density (flour absorbs moisture and weighs more), but altitude alone doesn't change the grams in a cup. If your flour feels damp, expect the weight to run slightly high."
      }
    ],
    tips: [
      "Spoon flour into the cup, then level it — don't scoop with the cup itself.",
      "When a recipe says 'grams', use the scale; the converter is your backup for cup-only recipes.",
      "Sticky ingredients (honey, molasses) are easier to weigh if you oil the spoon first.",
      "The same density table powers the Measurement → Weight recipe converter.",
      "For liquids like milk and water, 1 ml weighs about 1 g — no conversion needed."
    ],
    meta_title: "Grams to Cups Converter — Ingredient-Specific Weights | CookChase",
    meta_description:
      "Free grams-to-cups converter with 50+ ingredient densities. Convert cups, tablespoons and teaspoons to grams — or back — for baking and cooking.",
    featured: 1,
    sort_order: 28
  },
  {
    slug: "meat-doneness-guide",
    name: "Meat Doneness Temperature Guide",
    tagline: "Target internal temperatures for steak, pork, lamb, chicken, turkey and fish.",
    category: "Meat & Seafood",
    icon: "Thermometer",
    description:
      "Perfect doneness is a number, not a guess. This meat doneness temperature guide shows the exact target internal temperature for beef steak, roasts, pork, lamb, chicken, turkey and fish — each level with its visual description, the USDA safe minimum, and how long to rest before carving.\n\nA live thermometer visual tracks your chosen target, and every meat page includes the pro tip that separates good cooks from great ones: pull the meat a few degrees early, because carryover cooking keeps raising the temperature while it rests.",
    how_to_use:
      "1. Choose your meat: steak, roast, pork, lamb, chicken, turkey or fish.\n2. Pick your doneness (or the fixed target for poultry and fish).\n3. Read the target internal temperature in °F and °C with the visual guide.\n4. Check the USDA safe minimum, the resting time and the pro tip.\n5. Tap any doneness card to compare levels side by side.",
    formula:
      "Each doneness level stores a target internal temperature measured in the thickest part of the meat, away from bone and fat. Safety minimums follow USDA guidelines (145°F for steaks and pork, 165°F for poultry). The tool also suggests a pull temperature five degrees below target, because residual heat continues cooking the meat during the rest.",
    code:
      "const DONENESS = {\n  'beef steak': {\n    'medium-rare': { f: 135, c: 57, rest: '5 min' },\n    medium: { f: 145, c: 63, rest: '5 min' }\n  },\n  chicken: { safe: { f: 165, c: 74, rest: '5-10 min' } }\n};\nconst pullTemp = (target) => target - 5; // carryover cooking",
    faq: [
      {
        q: "What does 'carryover cooking' mean?",
        a: "After you take meat off the heat, residual heat keeps traveling inward, raising the internal temperature by 5-10°F (3-5°C) over the resting time. Pulling your steak at 130°F gives you a true medium-rare 135°F when it's done resting."
      },
      {
        q: "Is pink pork safe now?",
        a: "Yes. The USDA lowered pork's safe minimum to 145°F with a 3-minute rest in 2011. A slightly pink, juicy center at 145°F is both safe and noticeably better than the dry 160°F pork of the past."
      },
      {
        q: "Why does chicken need 165°F everywhere?",
        a: "Poultry can carry Salmonella and Campylobacter, which are killed instantly at 165°F. Dark meat actually tastes better around 175-180°F because collagen renders — the tool lists both targets so you can choose."
      },
      {
        q: "Where exactly should I put the thermometer?",
        a: "Insert the probe into the thickest part of the meat, away from bone, fat and gristle — those read hotter than the true center. For whole birds, check the thigh joint rather than the breast."
      }
    ],
    tips: [
      "A probe thermometer with an alarm is the single best kitchen upgrade you can buy.",
      "Rest steaks 5 minutes, roasts 15-20 minutes, turkey 20-30 minutes before carving.",
      "Bone-in cuts cook slower than boneless — allow a little extra time and trust the probe.",
      "Sushi-grade fish can be served rare by choice; ordinary fish should hit 145°F.",
      "Use this guide with the Meat Cooking Time Calculator to time the whole roast."
    ],
    meta_title: "Meat Doneness Temperature Guide — Safe Internal Temps | CookChase",
    meta_description:
      "Free meat doneness temperature guide. Target internal temperatures for steak, pork, lamb, chicken, turkey and fish with USDA safety minimums and resting times.",
    featured: 1,
    sort_order: 29
  },
  {
    slug: "food-shelf-life",
    name: "Food Shelf Life Calculator",
    tagline: "How long does it keep? Expiry dates, countdowns and safe storage times.",
    category: "Cooking Guides",
    icon: "Snowflake",
    description:
      "Milk, leftovers, eggs, deli meat — how long is that actually safe, and when exactly does it expire? This food shelf life calculator picks a food, a storage spot (pantry, fridge or freezer) and the date you stored it, then works out the use-by date and shows a live freshness countdown with a color-coded bar.\n\nIt covers 18 everyday foods and drinks with USDA-style shelf-life data, and every result includes the storage tip that actually matters — like the 2-hour rule for perishables and why freezing pauses, but never cures.",
    how_to_use:
      "1. Pick a food (leftovers, milk, raw chicken, eggs, deli meat and more).\n2. Choose where it's stored: pantry, refrigerator or freezer.\n3. Enter the date you stored or opened it.\n4. Read the use-by date, the days remaining and a color-coded freshness bar.\n5. Check the safety note and the 2-hour rule reminder below the result.",
    formula:
      "Each food in the database stores three shelf lives: days at room temperature, days refrigerated, and days frozen. The tool adds the appropriate shelf life to the date you entered, compares the resulting expiry date with today, and reports how many days are left — or how long ago it expired. The freshness bar shows how far through the shelf life you are.",
    code:
      "const SHELF_LIFE = {\n  'cooked leftovers': { pantry: 2 / 24, fridge: 4, freezer: 90 },\n  milk: { pantry: 0.5, fridge: 7, freezer: 90 },\n  'raw chicken': { pantry: 2 / 24, fridge: 2, freezer: 270 }\n};\nconst expiryDate = (start, days) =>\n  new Date(start.getTime() + days * 86400000);",
    faq: [
      {
        q: "Are these dates safety dates or quality dates?",
        a: "They're USDA-style guidelines for how long food stays safe under proper storage. 'Best by' labels are about quality and are usually conservative; the calculator uses the practical shelf life for opened food, which is shorter than unopened."
      },
      {
        q: "How long can cooked food really stay in the fridge?",
        a: "Cooked leftovers are safe for 3-4 days refrigerated at or below 4°C (40°F). The calculator sets cooked leftovers at 4 days, then warns you as the countdown approaches zero."
      },
      {
        q: "Can I freeze food on its last day and keep it longer?",
        a: "Yes — freezing on (or even slightly after) the expiry date is safe because the food was never left out too long. Quality fades over months in the freezer, but safety holds; thaw in the fridge, never on the counter."
      },
      {
        q: "What's the 2-hour rule?",
        a: "Perishable food left at room temperature for more than 2 hours (1 hour if it's above 32°C) enters the danger zone where bacteria multiply fast — and should be discarded even if it still looks fine."
      }
    ],
    tips: [
      "Label leftovers with the date — your memory is more optimistic than your fridge.",
      "Keep the fridge at or below 4°C and check it with a thermometer occasionally.",
      "Wash berries only before eating; moisture in the container grows mold fast.",
      "When in doubt, throw it out — a $5 meal is cheaper than food poisoning.",
      "Freeze herbs in oil in ice-cube trays to keep them months past their prime."
    ],
    meta_title: "Food Shelf Life Calculator — Expiry Dates & Countdown | CookChase",
    meta_description:
      "Free food shelf life calculator. Enter a food, its storage spot and the date you stored it to get the use-by date, days remaining and safe storage guidance.",
    featured: 0,
    sort_order: 30
  },
  {
    slug: "measurement-to-weight",
    name: "Recipe Measurement → Weight Converter",
    tagline: "Rewrite any cup-based recipe in grams — ingredient by ingredient, with totals.",
    category: "Kitchen Helpers",
    icon: "Repeat",
    description:
      "Recipes written in cups and spoons are a gamble: the same '1 cup of flour' can weigh 110 g or 140 g depending on how you scoop. This measurement-to-weight converter rewrites your whole recipe in grams, the way professional bakers measure.\n\nAdd each ingredient with its amount and unit (cups, tablespoons or teaspoons), and the tool converts every line using ingredient-specific densities, shows the total dough or batter weight, and merges duplicate ingredients so you know exactly how much of each you need.",
    how_to_use:
      "1. Add each ingredient from your recipe with its amount and unit (cups, tbsp or tsp).\n2. The tool converts every line to grams instantly.\n3. Read the total weight of the whole recipe at a glance.\n4. Check the combined totals section to see duplicates merged by ingredient.\n5. Copy the converted gram-based recipe and bake with confidence.",
    formula:
      "Each row is converted using the ingredient's grams-per-cup density: grams equal the number of cups times the density, and spoons scale down by 16 (tablespoons) or 48 (teaspoons) per cup. The tool sums every row for the total weight and groups rows by ingredient so a recipe with flour in two places shows one combined weight.",
    code:
      "function convertRow(amount, unit, gPerCup) {\n  const cups = unit === 'cup' ? amount :\n    unit === 'tbsp' ? amount / 16 : amount / 48;\n  return cups * gPerCup;\n}\nconst total = rows.reduce((sum, r) => sum + convertRow(r.amount, r.unit, r.gPerCup), 0);",
    faq: [
      {
        q: "Why is weighing better than cups for baking?",
        a: "Flour settles and compresses in storage, so cup measurements drift by 20% or more. Weighing gives identical results every time, which is why commercial bakers never measure by volume. This tool makes the switch painless."
      },
      {
        q: "What if my recipe has an ingredient not in the list?",
        a: "The converter includes 50+ common baking and cooking ingredients. For anything missing, use the nearest density from the same family — or measure by water weight if it's a liquid, since 1 ml of water weighs 1 g."
      },
      {
        q: "Do I need to convert liquids too?",
        a: "Liquids like milk and water weigh almost exactly 1 g per ml, so 1 cup is about 240 g. The density table includes them for completeness, but you can also measure liquids by volume without much risk."
      },
      {
        q: "How is this different from the Grams ↔ Cups converter?",
        a: "The Grams ↔ Cups converter handles a single conversion; this tool converts a whole recipe at once, totals the weight and merges duplicate ingredients. Use them together for a complete baking workflow."
      }
    ],
    tips: [
      "Convert your favorite recipes once and save the gram versions — you'll never look back.",
      "Weigh wet ingredients in a measuring cup on the scale and tare between each one.",
      "For sticky ingredients, coat the spoon or cup with a little oil first.",
      "Record the total weight in your notes — it's the number that tells you if a batch is right.",
      "Works great with the Recipe Scaler once everything is in grams."
    ],
    meta_title: "Recipe Measurement to Weight Converter — Cups to Grams | CookChase",
    meta_description:
      "Free recipe measurement-to-weight converter. Rewrite any cup-based recipe in grams with per-ingredient densities, total batch weight and merged totals.",
    featured: 1,
    sort_order: 31
  }
];

export const sectionsSeed = [
  {
    key: "hero_badge",
    title: "20+ free kitchen tools",
    subtitle: "",
    content: "",
    badge: "Free forever · No sign-up",
    enabled: 1
  },
  {
    key: "hero_title",
    title: "Cook smarter with the right kitchen math",
    subtitle: "",
    content: "",
    badge: "",
    enabled: 1
  },
  {
    key: "hero_subtitle",
    title:
      "Scale recipes, convert units, time your roasts and plan your week — 20+ fast, free cooking tools that do the math so you can focus on the cooking.",
    subtitle: "",
    content: "",
    badge: "",
    enabled: 1
  },
  {
    key: "hero_cta_primary",
    title: "Browse all tools",
    subtitle: "",
    content: "",
    badge: "",
    enabled: 1
  },
  {
    key: "hero_cta_secondary",
    title: "Explore the guides",
    subtitle: "",
    content: "",
    badge: "",
    enabled: 1
  },
  {
    key: "features_badge",
    title: "Why CookChase",
    subtitle: "",
    content: "",
    badge: "Built for home cooks",
    enabled: 1
  },
  {
    key: "features_title",
    title: "Every tool, one rule: no fluff",
    subtitle: "",
    content: "",
    badge: "",
    enabled: 1
  },
  {
    key: "features_subtitle",
    title:
      "We built CookChase for one person: the home cook standing at the counter wondering 'how much salt was that again?' Fast tools, honest formulas, zero paywalls.",
    subtitle: "",
    content: "",
    badge: "",
    enabled: 1
  },
  {
    key: "feature_1",
    title: "Instant results",
    subtitle: "No accounts",
    content:
      "Every tool calculates as you type. There's no sign-up, no trial period, no premium tier — the math is right there, free.",
    badge: "Zap",
    enabled: 1
  },
  {
    key: "feature_2",
    title: "Based on real food science",
    subtitle: "Trusted references",
    content:
      "Times, temperatures and ratios come from USDA guidelines, baker's percentages and standard culinary practice — not vibes.",
    badge: "Shield",
    enabled: 1
  },
  {
    key: "feature_3",
    title: "Honest formulas",
    subtitle: "See the math",
    content:
      "Every tool page shows the formula behind the numbers, so you understand the result and can trust it in your kitchen.",
    badge: "Lightbulb",
    enabled: 1
  },
  {
    key: "feature_4",
    title: "Mobile friendly",
    subtitle: "Phone first",
    content:
      "The tools live where you cook. Everything is responsive and works one-handed while you stir, flip and season.",
    badge: "Smartphone",
    enabled: 1
  },
  {
    key: "feature_5",
    title: "Beginner friendly",
    subtitle: "Plain language",
    content:
      "No culinary degree required. Each guide explains the why in simple terms, with tips you'll actually remember.",
    badge: "BookOpen",
    enabled: 1
  },
  {
    key: "feature_6",
    title: "Free forever",
    subtitle: "No paywalls",
    content:
      "All 20+ tools are free to use and always will be. CookChase stays useful — that's the whole point.",
    badge: "Heart",
    enabled: 1
  },
  {
    key: "tools_badge",
    title: "The toolset",
    subtitle: "",
    content: "",
    badge: "20+ interactive tools",
    enabled: 1
  },
  {
    key: "tools_title",
    title: "Every kitchen calculator you'll ever need",
    subtitle: "",
    content: "",
    badge: "",
    enabled: 1
  },
  {
    key: "tools_subtitle",
    title:
      "From scaling a recipe to running a sous vide bath — pick a tool, do the thing, get back to cooking.",
    subtitle: "",
    content: "",
    badge: "",
    enabled: 1
  },
  {
    key: "about_badge",
    title: "About CookChase",
    subtitle: "",
    content: "",
    badge: "Our story",
    enabled: 1
  },
  {
    key: "about_title",
    title: "Built by cooks who got tired of the math",
    subtitle: "",
    content: "",
    badge: "",
    enabled: 1
  },
  {
    key: "about_text",
    title:
      "CookChase started in a small kitchen with a too-small recipe card. We kept doing fractions on our phones until we realized the internet should have a better answer. Now we publish free, honest cooking tools that solve real kitchen problems — and we explain the formulas so you can cook with understanding, not just instructions.",
    subtitle: "",
    content: "",
    badge: "",
    enabled: 1
  },
  {
    key: "cta_title",
    title: "Ready to cook with confidence?",
    subtitle: "",
    content: "",
    badge: "",
    enabled: 1
  },
  {
    key: "cta_text",
    title:
      "Start with the most-used tool on the site: the Recipe Scaler. Your kitchen math just got a whole lot easier.",
    subtitle: "",
    content: "",
    badge: "",
    enabled: 1
  },
  {
    key: "cta_button",
    title: "Open the Recipe Scaler",
    subtitle: "",
    content: "",
    badge: "",
    enabled: 1
  }
];

export const pagesSeed = [
  {
    slug: "about",
    title: "About CookChase",
    subtitle: "Free, honest cooking tools for home cooks everywhere.",
    content:
      "CookChase is a free collection of interactive cooking tools, calculators and practical kitchen guides.\n\nWe built it because the kitchen is full of small math problems — scaling a recipe for six people, converting a British recipe to cups, timing a roast so it's actually medium, figuring out how much brine a turkey needs. Most home cooks solve these with a phone, a calculator app and a prayer. We wanted a better answer.\n\n## What we do\n\nEvery tool on CookChase follows three rules:\n\n- **It's free.** No accounts, no trials, no paywalls, ever.\n- **It's honest.** We show the formula behind every result, so you can trust the numbers.\n- **It's practical.** Each tool solves a real problem in minutes and points you back to the kitchen.\n\n## Where the numbers come from\n\nOur times, temperatures and ratios are based on USDA guidelines, baker's percentages and standard culinary practice. Where there's a range, we say so. We'd rather be honest about uncertainty than pretend the kitchen is an exact science.\n\n## The name\n\nCookChase comes from the idea that great cooking is a small chase — chasing the perfect crust, the right doneness, the texture that makes people close their eyes. We chase it with you, one calculation at a time.\n\n## Contact\n\nQuestions, corrections or ideas for a new tool? We read everything. Reach us at **hello@cookchase.com**.",
    meta_title: "About CookChase — Free Cooking Tools for Home Cooks",
    meta_description:
      "Learn about CookChase: free, honest cooking tools and calculators built for home cooks. No paywalls, no sign-ups — just useful kitchen math."
  },
  {
    slug: "contact",
    title: "Contact Us",
    subtitle: "Questions, corrections or tool ideas — we'd love to hear from you.",
    content:
      "We read every message. Whether you found a calculation worth correcting, spotted a missing ingredient, or want to suggest the next tool, this is the place.\n\n## Before you write\n\n- **Tool corrections:** If a tool gives a result you believe is wrong, include the exact numbers you entered and what you expected.\n- **Ad feedback:** If an ad placement is interfering with your experience, tell us where you saw it.\n- **Business inquiries:** For partnerships or licensing, include your company and the nature of the inquiry.\n\n## Email\n\nYou can reach the team directly at **hello@cookchase.com**. We typically reply within 2 business days.\n\n## Response times\n\n| Type | Expected response |\n| --- | --- |\n| Tool corrections | 1-2 business days |\n| General questions | 2-3 business days |\n| Business inquiries | 3-5 business days |\n\nWe're a small team of cooks and engineers, so please be patient with us — good answers take a little time.",
    meta_title: "Contact CookChase — Get in Touch",
    meta_description:
      "Contact the CookChase team with questions, corrections or tool ideas. We read every message and reply within 2 business days."
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    subtitle: "How CookChase handles your data — in plain English.",
    content:
      "CookChase respects your privacy. This policy explains what information we collect, how we use it, and the choices you have. It applies to the website at cookchase.com and any tools or pages it hosts.\n\n## Information we collect\n\n**Information you provide.** If you contact us by email, we receive the details you send us. We don't ask you to create accounts, and the tools themselves don't store your inputs.\n\n**Anonymous usage data.** We collect basic, aggregated information about how the site is used — pages viewed, tools used, device type — to understand what's helpful and to keep the site fast and reliable.\n\n**Cookies.** We use cookies and similar technologies for essential site functions and, where enabled, for advertising personalization. You can control cookies through your browser settings at any time.\n\n## Advertising\n\nCookChase may display advertising served by third-party partners, including Google AdSense. These partners may use cookies to serve ads based on your prior visits to this and other websites. You can opt out of personalized advertising at Google's Ads Settings, or visit **aboutads.info** for broader opt-out options.\n\nWhen you visit a page, third-party advertisers may use information about your visits (but not your name, address, email or phone number) to measure the effectiveness of their ads and personalize the ads you see.\n\n## How we use your information\n\n- To operate, maintain and improve the site and its tools.\n- To respond to your messages and requests.\n- To understand usage patterns and improve our content.\n- To display advertising that funds the free tools.\n\nWe do not sell your personal information. Ever.\n\n## Data retention\n\nAnonymous usage data is retained in aggregated form. Contact correspondence is kept only as long as needed to resolve your inquiry.\n\n## Children's privacy\n\nCookChase is not directed at children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided us personal information, contact us and we will delete it.\n\n## Your choices\n\n- **Browser cookies:** You can block or delete cookies through your browser settings.\n- **Personalized ads:** Opt out via Google Ads Settings.\n- **Contact:** Email us at **hello@cookchase.com** with any privacy questions.\n\n## Changes to this policy\n\nWe may update this policy from time to time. The latest version will always be published on this page, with an updated effective date below.\n\n**Effective date:** August 2026.",
    meta_title: "Privacy Policy — CookChase",
    meta_description:
      "CookChase privacy policy: how we collect and use data, cookie information, advertising partners like Google AdSense, and your choices and rights."
  },
  {
    slug: "terms",
    title: "Terms of Service",
    subtitle: "The simple rules for using CookChase.",
    content:
      "By using CookChase (cookchase.com), you agree to these terms. They're intentionally short and written in plain language.\n\n## 1. The tools are free\n\nAll tools and guides on CookChase are provided free of charge. We may change, add or remove tools at any time without notice.\n\n## 2. No professional advice\n\nOur calculators and guides provide estimates for general informational purposes. They are not medical advice, dietary advice for specific conditions, or food-safety certification. Always follow your local food-safety guidelines, cook to safe internal temperatures, and consult a professional for health-related questions.\n\n## 3. Accuracy of results\n\nThe tools are provided 'as is' without warranties of any kind. While we work hard to keep calculations correct, you are responsible for verifying results, especially when cooking for others. Culinary outcomes can vary with equipment, ingredients and technique.\n\n## 4. Your content\n\nIf you contact us or submit suggestions, you grant us the right to use your feedback to improve the site. You remain responsible for anything you send us.\n\n## 5. Acceptable use\n\nYou agree not to misuse the site — including attempts to disrupt it, scrape it at harmful volumes, or use it for unlawful purposes.\n\n## 6. Intellectual property\n\nAll content on CookChase, including text, tools, formulas and design, belongs to CookChase unless otherwise noted. You may share links and use the tools freely; you may not republish our content wholesale without permission.\n\n## 7. Limitation of liability\n\nTo the maximum extent permitted by law, CookChase is not liable for any damages arising from your use of the site, including cooking results, or from reliance on our tools or content.\n\n## 8. Changes\n\nWe may update these terms from time to time. The latest version will always appear on this page.\n\n**Effective date:** August 2026.",
    meta_title: "Terms of Service — CookChase",
    meta_description:
      "CookChase terms of service: the simple rules for using our free cooking tools, including disclaimers about accuracy and professional advice."
  }
];

export const adsSeed = [
  {
    name: "Header banner",
    location: "header",
    code: "",
    enabled: 0,
    sort_order: 1
  },
  {
    name: "Tool top (before widget)",
    location: "tool_top",
    code: "",
    enabled: 0,
    sort_order: 2
  },
  {
    name: "Tool bottom (after content)",
    location: "tool_bottom",
    code: "",
    enabled: 0,
    sort_order: 3
  },
  {
    name: "Homepage between sections",
    location: "home_middle",
    code: "",
    enabled: 0,
    sort_order: 4
  },
  {
    name: "Footer banner",
    location: "footer",
    code: "",
    enabled: 0,
    sort_order: 5
  }
];

export const articlesSeed = [
  {
    slug: "how-to-scale-any-recipe",
    title: "How to Scale Any Recipe Without Ruining It",
    excerpt:
      "Doubling a cake recipe seems easy — until the texture changes. Here's the method professional cooks actually use to scale recipes safely.",
    category: "Techniques",
    content:
      "Scaling a recipe sounds trivial: double everything, right? But anyone who has baked a doubled cake knows the truth — the texture changes, the edges burn, the middle sinks. Here's the smarter way.\n\n## Start with weight\n\nVolume measurements (cups and spoons) hide a lot of error. A 'cup' of flour can be 110 g or 150 g depending on how it was scooped. If the original recipe lists weights, scale those. If it only lists volumes, weigh your first batch once to build a reference.\n\n## The math is simple\n\nA recipe's scale factor is: desired servings divided by original servings. Multiply every ingredient by that factor. This works beautifully for soups, stews, sauces and most savory dishes.\n\n## Baking is the exception\n\nBaked goods are chemical reactions, and not all ingredients scale linearly:\n\n- **Leavening and salt:** use about 75% of a strict doubling. Too much baking powder tastes metallic; too much salt changes the rise.\n- **Spices:** scale at 75-85% — dried spices become overwhelming fast.\n- **Eggs:** they don't scale in fractions of an egg. Use weight (one large egg ≈ 50 g) or beat the egg and use a portion.\n\n## Watch the pan\n\nMore batter needs a bigger pan, but area matters more than volume. A 9-inch round pan has about 63 square inches of area; a 13×9 pan has 117. If you double a recipe, your pan needs roughly twice the surface area — otherwise the cake comes out as a dome that never cooks through.\n\n## Adjust the time, not the temperature\n\nA larger, deeper bake needs more time at a slightly lower temperature (drop 25°F, add 15-20% time). Check doneness with a thermometer or toothpick, not the clock.\n\n## The takeaway\n\nScale savory dishes freely, scale bakes carefully, and never trust volume conversions alone. When in doubt, use our Recipe Scaler — it handles the arithmetic so you can focus on the tasting.",
    meta_title: "How to Scale Any Recipe Without Ruining It | CookChase",
    meta_description:
      "Learn the professional method for scaling recipes: weigh ingredients, adjust leavening, change pans correctly, and avoid the classic doubling mistakes."
  },
  {
    slug: "oven-temperatures-explained",
    title: "Oven Temperatures Explained: °F, °C and Gas Marks",
    excerpt:
      "350°F vs 180°C — same thing or not? Here's everything about oven temperature conversions, including why fan ovens behave differently.",
    category: "Basics",
    content:
      "Recipe books from the US, UK and Europe use different temperature scales, which is confusing enough — and then the fan oven shows up and changes everything.\n\n## The three scales\n\n- **Fahrenheit (°F):** used in the US. Water boils at 212°F.\n- **Celsius (°C):** used almost everywhere else. Water boils at 100°C.\n- **Gas Mark:** a rough 1-9 scale used in older UK recipes.\n\n## The conversions\n\n**°C = (°F − 32) × 5/9** and **°F = °C × 9/5 + 32**. For example, 350°F is exactly 176.7°C — recipes round this to 180°C.\n\nCommon oven settings:\n\n- 300°F = 150°C (slow)\n- 350°F = 180°C (moderate — most baking)\n- 400°F = 200°C (roasting)\n- 425°F = 220°C (hot — pizza, pastry)\n- 450°F = 230°C (very hot)\n\n## Fan ovens are different\n\nConvection (fan) ovens circulate hot air, so they cook faster and more evenly. The standard adjustment is to drop the temperature by 20°C (about 25°F) and start checking for doneness about 15% earlier.\n\nNot every recipe adapts well: delicate custards and soufflés can dry out in a fan oven. When in doubt, reduce the temperature and watch closely.\n\n## Words like 'moderate'\n\nOld recipes used words, not numbers: slow (300°F), moderate (350°F), hot (400°F), very hot (450°F). These are loose — a modern recipe will almost always give a number.\n\n## A tip that saves cakes\n\nEvery oven lies a little. Dial settings drift, hot spots exist, and the display temperature is rarely exact. An $8 oven thermometer on the center rack is the cheapest way to make every conversion above actually work for you. Check it once a month.\n\nUse our Oven Temperature Converter whenever a recipe speaks a different language than your oven.",
    meta_title: "Oven Temperatures Explained — °F, °C and Gas Marks | CookChase",
    meta_description:
      "Oven temperature conversions explained: Fahrenheit to Celsius to gas marks, fan oven adjustments, common settings, and why an oven thermometer matters."
  },
  {
    slug: "meal-prep-beginners-guide",
    title: "Meal Prep for Beginners: The One-Hour Method",
    excerpt:
      "You don't need Sunday to disappear into the kitchen. Here's a one-hour meal prep routine that actually survives a busy week.",
    category: "Meal Prep",
    content:
      "Most meal prep guides assume you'll spend four hours cooking on Sunday. That's a great way to quit by the third week. This method works differently: it's one hour, one plan, and it survives a real week.\n\n## The one-hour structure\n\nSplit your hour into three 20-minute blocks:\n\n1. **Cook the protein (20 min).** One protein that works in three meals — shredded chicken, ground beef, or a big tray of sheet-pan chicken thighs. Season simply.\n2. **Cook a starch (20 min).** A big batch of rice, quinoa or roasted potatoes. This is the 'bulk' that makes every meal filling.\n3. **Prep vegetables (20 min).** Roast a sheet pan of vegetables (broccoli, peppers, zucchini) and slice a couple of salad-ready vegetables.\n\nThat's it. You now own the skeleton of every meal this week.\n\n## How the week plays out\n\n- **Monday:** protein + starch + roasted veg\n- **Tuesday:** protein + salad bowl (starch on the side)\n- **Wednesday:** protein + starch + veg in a wrap or tortilla\n- **Thursday:** protein + starch stir-fried with a sauce\n- **Friday:** leftovers, or the one night you eat out guilt-free\n\n## Storage rules that keep food safe\n\n- Cooked food keeps 3-4 days in the fridge (4°C or below).\n- Portion into single-serving containers before refrigerating.\n- Freeze anything you won't eat by day 4.\n- Label everything — 'mystery container' is how good food gets thrown away.\n\n## Two principles that make it stick\n\n**Overlap ingredients, not meals.** One protein in three different presentations beats three separate recipes.\n\n**Cook what you actually like.** Meal prep fails when people prep food they'd never order at a restaurant. Prep your favorite foods in bulk, not 'healthy' foods you'll resent by Wednesday.\n\n## Keep it small at first\n\nPrep just dinners for two weeks before you add breakfasts. When the routine is boring and automatic, expand it. Use the Meal Prep Planner to build your weekly plan and generate a single shopping list — then set your one-hour timer and go.",
    meta_title: "Meal Prep for Beginners: The One-Hour Method | CookChase",
    meta_description:
      "A realistic one-hour meal prep routine: one protein, one starch, one tray of vegetables — and how to turn them into a week of varied, safe meals."
  }
];
