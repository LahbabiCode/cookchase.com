// Dynamic per-tool FAQ library.
//
// Each tool widget publishes its current inputs and key results as "facts"
// ({ key: { label, value } }) through components/tools/faqStore.ts. This
// module is PURE (standard library only, so node --test can load it) and
// turns those facts into realistic, collapsible Q&As whose answers speak in
// terms of the values the visitor actually entered — e.g. "With 4 servings,
// each serving is 350 kcal".
//
// Question strings may contain {key} placeholders that are filled from the
// published facts; answers are either template strings (same placeholder
// syntax) or functions that build the sentence from the facts object.
// Items with a `when` predicate are only shown while that condition holds,
// so questions appear and disappear with the visitor's inputs.

import type { ToolFacts } from "../components/tools/faqStore";
import { EXTRA_FAQS } from "./tool-faq-extra.ts";

export interface FaqItemDef {
  /** Hide the question unless this returns true (facts optional for guests). */
  when?: (f: ToolFacts) => boolean;
  /** Question text; may contain {key} placeholders filled from the facts. */
  q: string;
  /** Template string with {key} placeholders, or a function building the answer. */
  a: string | ((f: ToolFacts) => string);
}

/** Reads a fact's value string, or "" when the tool has not published it. */
export function fact(f: ToolFacts, key: string): string {
  return f[key]?.value ?? "";
}

/** Replaces every {key} placeholder with the matching fact value. */
export function interpolate(template: string, f: ToolFacts): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (m, key: string) =>
    f[key]?.value !== undefined ? f[key].value : m
  );
}

/**
 * Build the rendered dynamic FAQ items for a tool from its definition and the
 * facts currently published by the widget. Items whose `when` predicate fails
 * (or whose question contains an unfilled placeholder) are skipped, so the
 * FAQ never talks about values the visitor has not entered.
 */
export function buildDynamicFaq(
  slug: string,
  f: ToolFacts,
  defs: Record<string, FaqItemDef[]> = ALL_FAQS
): { q: string; a: string }[] {
  const defsForSlug = defs[slug];
  if (!defsForSlug) return [];
  const out: { q: string; a: string }[] = [];
  for (const item of defsForSlug) {
    if (item.when && !item.when(f)) continue;
    const q = interpolate(item.q, f);
    if (!q.includes("{") && q.trim().length > 0) {
      const a =
        typeof item.a === "function" ? item.a(f) : interpolate(item.a, f);
      out.push({ q, a });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Per-tool definitions. The fact keys here MUST match what each widget
// publishes via usePublishToolFacts (see the widgets in components/tools).
// ---------------------------------------------------------------------------

export const FAQS: Record<string, FaqItemDef[]> = {
  "recipe-scaler": [
    {
      when: (f) => fact(f, "factor") !== "",
      q: "My recipe makes {servingsFrom} servings. What does the {factor} scale factor mean?",
      a: (f) =>
        `Every ingredient amount is multiplied by ${fact(f, "factor")} — the recipe now makes ${fact(f, "servingsTo")} servings instead of ${fact(f, "servingsFrom")}.`
    },
    {
      when: (f) => fact(f, "ing1Scaled") !== "",
      q: "How much {ing1Name} do I need for {servingsTo} servings?",
      a: (f) =>
        `You'll need ${fact(f, "ing1Scaled")} ${fact(f, "ing1Unit")}, up from ${fact(f, "ing1Orig")} ${fact(f, "ing1Unit")} in the original recipe.`
    },
    {
      when: (f) => parseFloat(fact(f, "factor")) > 1.5,
      q: "When scaling up, should I change the baking powder, salt or spices?",
      a: "Scale leavening, salt and spices to about 75% of the straight multiplier — doubling them exactly can make baked goods taste salty or metallic. Weighing ingredients gives the most reliable result."
    }
  ],

  "unit-converter": [
    {
      when: (f) => fact(f, "result") !== "",
      q: "What is {amount} {from} in {to}?",
      a: (f) =>
        `${fact(f, "amount")} ${fact(f, "from")} equals ${fact(f, "result")} ${fact(f, "to")}.`
    },
    {
      when: (f) => fact(f, "from") !== "",
      q: "Is {amount} {from} the same for every ingredient?",
      a: (f) =>
        `This ${fact(f, "category")} conversion is exact for any ingredient — ${fact(f, "amount")} ${fact(f, "from")} is always ${fact(f, "result")} ${fact(f, "to")}. For cups and spoons, though, different ingredients weigh differently, so use the Grams ↔ Cups converter when a recipe asks for weight.`
    }
  ],

  "temperature-converter": [
    {
      when: (f) => fact(f, "value") !== "",
      q: "What is {value}°{mode} in Celsius and Fahrenheit?",
      a: (f) =>
        `${fact(f, "value")}°${fact(f, "mode")} is ${fact(f, "c")} and ${fact(f, "f")}.`
    },
    {
      when: (f) => fact(f, "gas") !== "",
      q: "What gas mark is {value}°{mode}?",
      a: (f) =>
        `${fact(f, "value")}°${fact(f, "mode")} is ${fact(f, "gas")} on the UK gas scale.`
    },
    {
      when: (f) => fact(f, "fan") !== "",
      q: "Do I need to change the time if I convert to a fan oven?",
      a: (f) =>
        `Keep the time the same but lower the temperature by about 20°C — so ${fact(f, "value")}°${fact(f, "mode")} becomes about ${fact(f, "fan")} on a fan/convection oven.`
    }
  ],

  "recipe-cost-calculator": [
    {
      when: (f) => fact(f, "perServing") !== "",
      q: "How much does this recipe cost per serving?",
      a: (f) =>
        `About ${fact(f, "perServing")} per serving — ${fact(f, "total")} total divided by ${fact(f, "servings")} servings.`
    },
    {
      when: (f) => fact(f, "estCount") !== "0",
      q: "Why are some prices marked “est.”?",
      a: (f) =>
        `${fact(f, "estCount")} of your ${fact(f, "rowCount")} ingredients used the average supermarket price because no price was entered. Type the real price for those rows to refine the total.`
    },
    {
      when: (f) => fact(f, "perServing") !== "",
      q: "Is cooking really cheaper than takeout?",
      a: (f) =>
        `This recipe works out to about ${fact(f, "perServing")} per serving. The same meal as takeout usually runs 2–4× more, even before delivery fees.`
    }
  ],

  "meat-cooking-time": [
    {
      when: (f) => fact(f, "weightKg") !== "",
      q: "How long does a {weightKg} kg {meat} take to cook?",
      a: (f) =>
        `Plan for ${fact(f, "timeMin")} to ${fact(f, "timeMax")} minutes for your ${fact(f, "weightKg")} kg ${fact(f, "meat")}.`
    },
    {
      when: (f) => fact(f, "temp") !== "",
      q: "What internal temperature should {meat} reach?",
      a: (f) =>
        `Aim for ${fact(f, "temp")} measured in the thickest part, away from bone and fat.`
    },
    {
      when: (f) => fact(f, "timeMin") !== "",
      q: "Why do you rest the meat after cooking?",
      a: (f) =>
        `Resting ${fact(f, "timeMin")}–${fact(f, "timeMax")} minute roasts for 15–20 minutes lets the juices redistribute and the carry-over heat finish the center — slicing early makes it dry.`
    }
  ],

  "baking-pan-converter": [
    {
      when: (f) => fact(f, "factor") !== "",
      q: "My recipe is for a {origPan}. If I use a {targetPan} instead, how do I adjust it?",
      a: (f) =>
        `Multiply every ingredient by ${fact(f, "factor")} — the {targetPan} holds ${fact(f, "targetArea")} vs ${fact(f, "origArea")} for the {origPan}.`
    },
    {
      when: (f) => parseFloat(fact(f, "factor")) >= 1.2,
      q: "Do I need to change the oven temperature with the bigger pan?",
      a: "Keep the same temperature but start checking doneness 10–15 minutes early — the batter is shallower in a bigger pan, so it bakes faster."
    },
    {
      when: (f) => parseFloat(fact(f, "factor")) <= 0.8,
      q: "The new pan is smaller — what changes?",
      a: "The batter will be deeper, so reduce the oven by 25°F (about 14°C) and add 15–20% more baking time. Check the center with a skewer."
    }
  ],

  "nutrition-calculator": [
    {
      when: (f) => fact(f, "kcalPer") !== "",
      q: "How many calories are in one serving?",
      a: (f) =>
        `${fact(f, "kcalPer")} per serving — the whole recipe is ${fact(f, "kcalTotal")} across ${fact(f, "servings")} servings.`
    },
    {
      when: (f) => fact(f, "proteinPer") !== "",
      q: "What are the macros for one serving?",
      a: (f) =>
        `Per serving: ${fact(f, "proteinPer")} protein, ${fact(f, "carbsPer")} carbs and ${fact(f, "fatPer")} fat.`
    },
    {
      when: (f) => fact(f, "servings") !== "",
      q: "Are these nutrition values exact?",
      a: (f) =>
        `They're estimates from USDA-style averages per 100 g of raw food — real values vary with brand, cut and cooking method. Use them to plan, not to obsess.`
    }
  ],

  "ingredient-substitution": [
    {
      when: (f) => fact(f, "selected") !== "",
      q: "What can I use instead of {selected}?",
      a: (f) =>
        `The top swap shown is ${fact(f, "topSub")}: ${fact(f, "topRatio")}.`
    },
    {
      when: (f) => fact(f, "selected") !== "",
      q: "Will swapping {selected} change the texture of my dish?",
      a: (f) =>
        `It can. Every option for ${fact(f, "selected")} has a note about texture and moisture — for example some swaps add sweetness or make baked goods denser, so read the note under the option you pick.`
    },
    {
      when: (f) => fact(f, "topRatio") !== "",
      q: "Is {topSub} really a 1:1 swap for {selected}?",
      a: (f) =>
        `Not always — the ratio for ${fact(f, "topSub")} is ${fact(f, "topRatio")}. When a swap changes volume or moisture, follow the ratio rather than guessing cup-for-cup.`
    }
  ],

  "meal-prep-planner": [
    {
      when: (f) => fact(f, "days") !== "",
      q: "How many meals does this plan cover?",
      a: (f) =>
        `Your plan covers ${fact(f, "days")} day(s) and ${fact(f, "mealsCount")} meal slot(s) at ${fact(f, "kcalPerDay")} per day.`
    },
    {
      when: (f) => fact(f, "budget") !== "",
      q: "Does the plan fit my {budget} budget?",
      a: (f) =>
        `The tool picks budget-friendly dishes to stay near ${fact(f, "budget")} per day — batch recipes and cheap proteins like chicken, beans and eggs keep it under.`
    },
    {
      when: (f) => fact(f, "days") !== "",
      q: "Can I really prep all this in one afternoon?",
      a: (f) =>
        `Most meals are batch-ready, so you cook a few big components once and reheat them across the ${fact(f, "days")} days. Freeze anything you won't eat within 3–4 days.`
    }
  ],

  "kitchen-timers": [
    {
      when: (f) => fact(f, "count") !== "",
      q: "How many timers am I running?",
      a: (f) =>
        `You have ${fact(f, "count")} timer(s) total, with ${fact(f, "active")} running right now.`
    },
    {
      when: (f) => fact(f, "active") !== "0",
      q: "What happens when a timer finishes?",
      a: (f) =>
        `The timer shows “Done!” and rings so you hear it over kitchen noise. You can reset it or remove it once it's finished.`
    },
    {
      when: (f) => fact(f, "count") !== "",
      q: "Can I run several dishes at once?",
      a: (f) =>
        `Yes — each timer runs independently, so you can juggle pasta, a roast and vegetables without watching the clock.`
    }
  ],

  "sous-vide-guide": [
    {
      when: (f) => fact(f, "tempC") !== "",
      q: "What temperature should I set for {protein} ({doneness})?",
      a: (f) =>
        `Set the water to ${fact(f, "tempC")} / ${fact(f, "tempF")} and hold it for at least ${fact(f, "timeMin")} minutes for {protein} at {doneness}.`
    },
    {
      when: (f) => fact(f, "timeMin") !== "",
      q: "Can I leave it in the water longer than {timeMin} minutes?",
      a: (f) =>
        `Yes — sous vide is forgiving: the time shown is the minimum to hit the target, and holding an extra hour (or two) is fine for most cuts. Only very long holds start to soften texture.`
    },
    {
      when: (f) => fact(f, "tempC") !== "",
      q: "Do I still need to sear it afterwards?",
      a: (f) =>
        `For meat, yes — pat it dry and sear 60–90 seconds per side in a ripping-hot pan. The sous vide cooks the inside; the sear makes the crust.`
    }
  ],

  "pizza-dough-calculator": [
    {
      when: (f) => fact(f, "total") !== "",
      q: "How much dough do I need for {pizzas} pizzas?",
      a: (f) =>
        `${fact(f, "total")} total — ${fact(f, "flour")} flour, ${fact(f, "water")} water, ${fact(f, "salt")} salt and ${fact(f, "yeast")} yeast — divided into ${fact(f, "pizzas")} balls of ${fact(f, "ballWeight")}.`
    },
    {
      when: (f) => fact(f, "hydration") !== "",
      q: "Is {hydration}% hydration good for pizza dough?",
      a: (f) =>
        `${fact(f, "hydration")}% is a classic range: ${fact(f, "texture")}. Lower hydration is easier to handle; higher gives a more open, airy crust.`
    },
    {
      when: (f) => fact(f, "flour") !== "",
      q: "How long should this dough ferment?",
      a: (f) =>
        `With ${fact(f, "yeast")} yeast, 2–4 hours at room temperature works, or 24–72 hours in the fridge for deeper flavor. Cold fermentation is the secret to a better crust.`
    }
  ],

  "sweetener-converter": [
    {
      when: (f) => fact(f, "equivalent") !== "",
      q: "How much {sweetener} replaces {sugar} g of sugar?",
      a: (f) =>
        `Use about ${fact(f, "equivalent")} ${fact(f, "unit")} of ${fact(f, "sweetener")} to match ${fact(f, "sugar")} g of sugar.`
    },
    {
      when: (f) => fact(f, "liquidAdjust") !== "0",
      q: "Do I need to adjust the other liquids in the recipe?",
      a: (f) =>
        `Yes — ${fact(f, "sweetener")} is liquid, so reduce the other liquid by about ${fact(f, "liquidAdjust")} per cup of sugar replaced.`
    },
    {
      when: (f) => fact(f, "sweetener") !== "",
      q: "Will it taste exactly as sweet as sugar?",
      a: (f) =>
        `The amount is matched for equal sweetness, but ${fact(f, "sweetener")} brings its own flavor — expect a hint of honey/maple character, and for baking you may want to lower the oven slightly.`
    }
  ],

  "bread-hydration": [
    {
      when: (f) => fact(f, "water") !== "",
      q: "How much water do I need for {hydration}% hydration with {flour} g of flour?",
      a: (f) =>
        `${fact(f, "water")} of water — that's ${fact(f, "hydration")}% of your ${fact(f, "flour")} of flour.`
    },
    {
      when: (f) => fact(f, "feel") !== "",
      q: "What should my dough feel like at {hydration}%?",
      a: (f) =>
        `Expect: ${fact(f, "feel")}.`
    },
    {
      when: (f) => fact(f, "total") !== "",
      q: "How much will my finished dough weigh?",
      a: (f) =>
        `About ${fact(f, "total")} including flour, water, salt and yeast — flour and water are the bulk of it.`
    }
  ],

  "sourdough-calculator": [
    {
      when: (f) => fact(f, "flour") !== "",
      q: "How much flour and water do I add to {current} g of starter?",
      a: (f) =>
        `Add ${fact(f, "flour")} of flour and ${fact(f, "water")} of water at your 1:{ratio}:{ratio} ratio — that assumes a 100% hydration starter.`
    },
    {
      when: (f) => parseFloat(fact(f, "discard")) > 0,
      q: "Why is there {discard} of discard?",
      a: (f) =>
        `Feeding ${fact(f, "current")} up to ${fact(f, "target")} creates ${fact(f, "discard")} of extra starter — save it for pancakes, crackers or a discard loaf.`
    },
    {
      when: (f) => fact(f, "ratio") !== "",
      q: "What does 1:{ratio}:{ratio} mean?",
      a: (f) =>
        `It means 1 part starter to ${fact(f, "ratio")} parts flour and ${fact(f, "ratio")} parts water by weight — the standard strong feed for a healthy levain.`
    }
  ],

  "brine-calculator": [
    {
      when: (f) => fact(f, "salt") !== "",
      q: "How much salt do I need for a {mode} brine of {weight} kg?",
      a: (f) =>
        `${fact(f, "salt")} of salt${fact(f, "water") !== "" ? ` in ${fact(f, "water")} of water` : ""} — enough to fully cover your ${fact(f, "weight")} kg.`
    },
    {
      when: (f) => fact(f, "time") !== "",
      q: "How long should {guide} brine?",
      a: (f) =>
        `${fact(f, "guide")} should brine for ${fact(f, "time")} — set a timer so it doesn't oversalt.`
    },
    {
      when: (f) => fact(f, "weight") !== "",
      q: "Do I still salt the recipe after brining?",
      a: (f) =>
        `No — pat the meat dry and skip the extra salt in your recipe. The ${fact(f, "weight")} kg is already seasoned through.`
    }
  ],

  "food-storage-guide": [
    {
      when: (f) => fact(f, "food") !== "",
      q: "How long does {food} last?",
      a: (f) =>
        `In the pantry: ${fact(f, "pantry")}. In the fridge: ${fact(f, "fridge")}. In the freezer: ${fact(f, "freezer")}.`
    },
    {
      when: (f) => fact(f, "food") !== "",
      q: "Can I freeze {food}?",
      a: (f) =>
        `${fact(f, "freezer")} is the freezer answer for ${fact(f, "food")} — freezing pauses spoilage, though quality fades over time.`
    },
    {
      when: (f) => fact(f, "note") !== "",
      q: "How can I tell if {food} has gone bad?",
      a: (f) =>
        `Look for the warning signs: ${fact(f, "note")}. When in doubt, smell, look and taste.`
    }
  ],

  "caffeine-calculator": [
    {
      when: (f) => fact(f, "total") !== "",
      q: "How much caffeine did I log?",
      a: (f) =>
        `Your ${fact(f, "drinks")} drink(s) add up to ${fact(f, "total")} of caffeine — ${fact(f, "status")}.`
    },
    {
      when: (f) => fact(f, "total") !== "" && parseFloat(fact(f, "total")) > 400,
      q: "I'm over 400 mg — is that a problem?",
      a: (f) =>
        `You logged ${fact(f, "total")}, above the FDA guideline of 400 mg for healthy adults. Spread your drinks out, switch later cups to decaf, and watch for sleep and jitters — it's a limit, not a cliff.`
    },
    {
      when: (f) => fact(f, "drinks") !== "0",
      q: "Which of my drinks has the most caffeine?",
      a: "Per 100 ml, espresso tops the list (210 mg), then cold brew and drip coffee — cola and tea are lower. Check the numbers on each row to see where your total comes from."
    }
  ],

  "alcohol-cookoff": [
    {
      when: (f) => fact(f, "remaining") !== "",
      q: "How much alcohol is left after {method}?",
      a: (f) =>
        `About ${fact(f, "remaining")} of alcohol remains — ${fact(f, "retention")} of what you added is retained with this method.`
    },
    {
      when: (f) => fact(f, "retention") !== "",
      q: "Does cooking really burn off all the alcohol?",
      a: (f) =>
        `No — even long simmers retain a little. With ${fact(f, "method")} you keep ${fact(f, "retention")}; only a 2.5+ hour open simmer gets down to about 5%.`
    },
    {
      when: (f) => fact(f, "volume") !== "",
      q: "Is this safe for kids or alcohol-free guests?",
      a: (f) =>
        `Your ${fact(f, "volume")} of ${fact(f, "alcohol")} leaves ${fact(f, "remaining")} after ${fact(f, "method")} — trace amounts remain, so for kids swap the alcohol for stock plus a splash of vinegar instead.`
    }
  ],

  "water-intake": [
    {
      when: (f) => fact(f, "total") !== "",
      q: "How much water should I drink at {weight} {unit}?",
      a: (f) =>
        `With your activity and climate, aim for ${fact(f, "total")} a day — about ${fact(f, "cups")}.`
    },
    {
      when: (f) => parseFloat(fact(f, "exercise")) > 0,
      q: "Does my {exercise} of exercise add extra water?",
      a: (f) =>
        `Yes — your exercise adds ${fact(f, "exerciseExtra")} on top of the baseline, and heavy sweating needs electrolytes too, not just water.`
    },
    {
      when: (f) => fact(f, "total") !== "",
      q: "Can I drink too much water?",
      a: (f) =>
        `It's possible, but rare — drinking far more than ${fact(f, "total")} very quickly can dilute your electrolytes. Sip through the day and let thirst be your guide.`
    }
  ],

  "pressure-cooker-converter": [
    {
      when: (f) => fact(f, "minutes") !== "",
      q: "How long do I cook {food} at high pressure?",
      a: (f) =>
        `Cook ${fact(f, "food")} for ${fact(f, "minutes")} at HIGH pressure, then ${fact(f, "release")}.`
    },
    {
      when: (f) => fact(f, "food") !== "",
      q: "Why does {food} need {release}?",
      a: (f) =>
        `Natural release lets the pressure drop slowly, which finishes the food gently and keeps ${fact(f, "food")} tender instead of spraying steam — quick release is for delicate items.`
    },
    {
      when: (f) => fact(f, "weight") !== "",
      q: "Do I adjust the time for my {weight} batch?",
      a: (f) =>
        `The time shown is scaled to your ${fact(f, "weight")}. Above 1,000 m altitude add ~5% per 300 m, since water boils at a lower temperature.`
    }
  ],

  "weekly-menu-generator": [
    {
      when: (f) => fact(f, "count") !== "",
      q: "What does this week's plan look like?",
      a: (f) =>
        `You have ${fact(f, "count")} dinners planned — ${fact(f, "batch")} batch-ready and ${fact(f, "quick")} under 30 minutes — with no two nights sharing the same protein.`
    },
    {
      when: (f) => fact(f, "count") !== "",
      q: "How do I keep my favorite day when I regenerate?",
      a: (f) =>
        `Press “Lock” on a day and it stays when you generate a new week — the rest of the plan refreshes around it.`
    },
    {
      when: (f) => fact(f, "batch") !== "0",
      q: "Which meals are best to prep ahead?",
      a: (f) =>
        `${fact(f, "batch")} of your ${fact(f, "count")} meals are marked batch-ready — cook those first and freeze or refrigerate portions for the busy nights.`
    }
  ],

  "dough-batch-converter": [
    {
      when: (f) => fact(f, "flour") !== "",
      q: "How much flour and water do I need for {target} of dough?",
      a: (f) =>
        `${fact(f, "flour")} of flour and ${fact(f, "water")} of water at ${fact(f, "hydration")}% hydration — plus ${fact(f, "salt")} of salt.`
    },
    {
      when: (f) => fact(f, "hydration") !== "",
      q: "What does {hydration}% hydration actually mean?",
      a: (f) =>
        `It means water is ${fact(f, "hydration")}% of the flour weight — the single number that controls how open and airy (or tight) the crumb turns out.`
    },
    {
      when: (f) => fact(f, "target") !== "",
      q: "Why is the total not exactly {target}?",
      a: (f) =>
        `Baker's percentages are rounded to grams, so your batch lands within a few grams of ${fact(f, "target")} — close enough to weigh and shape with confidence.`
    }
  ],

  "frying-temperature": [
    {
      when: (f) => fact(f, "f") !== "",
      q: "Is {f} a good temperature for frying?",
      a: (f) =>
        `At ${fact(f, "f")} you're ${fact(f, "verdict")} — most foods fry between 350°F and 375°F (177–191°C).`
    },
    {
      when: (f) => parseFloat(fact(f, "f")) < 330,
      q: "What happens if the oil is too cool?",
      a: (f) =>
        `Below about 330°F the oil soaks into the food instead of crisping it, leaving greasy, pale results. Bring it up to 350–375°F and fry in small batches so it never drops back down.`
    },
    {
      when: (f) => parseFloat(fact(f, "f")) > 385,
      q: "Is {f} too hot?",
      a: (f) =>
        `Above ~385°F the outside burns before the inside cooks, and the oil degrades fast. Drop to 350–375°F — ${fact(f, "f")} is past the sweet spot.`
    }
  ],

  "egg-timer": [
    {
      when: (f) => fact(f, "minutes") !== "",
      q: "How long do I boil a {style} egg?",
      a: (f) =>
        `${fact(f, "minutes")} from the moment the water boils${fact(f, "altitude") !== "0" ? ` — adjusted for your ${fact(f, "altitude")} elevation` : ""}.`
    },
    {
      when: (f) => fact(f, "style") !== "",
      q: "Do I start the timer from cold or boiling water?",
      a: (f) =>
        `From boiling. Lower the eggs in gently once the water is at a rolling boil, then start your ${fact(f, "minutes")} — starting cold gives unpredictable results.`
    },
    {
      when: (f) => fact(f, "style") !== "",
      q: "How do I get {style} eggs that peel easily?",
      a: (f) =>
        `After the timer ends, ice-bath the eggs for 30 seconds, then tap and roll gently. A pinch of baking soda in the water helps too — fresher eggs are naturally harder to peel.`
    }
  ]
};

/** FAQS plus the sibling-module definitions, merged for lookups and tests. */
export const ALL_FAQS: Record<string, FaqItemDef[]> = {
  ...FAQS,
  ...EXTRA_FAQS
};
