// Second half of the dynamic FAQ definitions (kept as a sibling module so
// lib/tool-faq.ts stays reviewable). Merged into FAQS via ALL_FAQS — the
// fact keys match what each widget publishes in components/tools/.

import type { ToolFacts } from "../components/tools/faqStore";
import type { FaqItemDef } from "./tool-faq";

// Same reader as lib/tool-faq.ts's fact(). Duplicated on purpose: importing
// the value from tool-faq.ts would create a runtime import cycle (tool-faq.ts
// imports EXTRA_FAQS from here). Type-only imports are erased, so the cycle
// would be silent and fragile — the 3-line helper is safer.
export function fact2(f: ToolFacts, key: string): string {
  return f[key]?.value ?? "";
}

export const EXTRA_FAQS: Record<string, FaqItemDef[]> = {
  "recipe-comparator": [
    {
      when: (f) => fact2(f, "count") !== "",
      q: "Which of my recipes comes out on top?",
      a: (f) =>
        `Across the comparison, ${fact2(f, "summary")} The cheapest per serving is ${fact2(f, "cheapest")} and the fastest is ${fact2(f, "fastest")}.`
    },
    {
      when: (f) => fact2(f, "count") !== "",
      q: "Is the cost per serving accurate?",
      a: (f) =>
        `Costs use the prices you entered for each ingredient, falling back to average supermarket rates where a row is marked “est.” — enter real prices to tighten the comparison.`
    },
    {
      when: (f) => fact2(f, "count") !== "",
      q: "Can I share this comparison?",
      a: "Yes — the “Share this comparison” button copies a link with your recipes encoded in it, so anyone who opens it sees the same three recipes side by side."
    }
  ],

  "coffee-espresso-calculator": [
    {
      when: (f) => fact2(f, "ratio") !== "",
      q: "What's my current brew ratio with {coffee} of coffee and {water} of water?",
      a: (f) =>
        `You're at 1:${fact2(f, "ratio")} — ${fact2(f, "strength")} for ${fact2(f, "method")}.`
    },
    {
      // brewStrength() returns the lowercase word ("balanced"/"weak"/"strong")
      // — the widget publishes it verbatim, so only show the fix question for
      // brews that actually need fixing.
      when: (f) => fact2(f, "ratio") !== "" && fact2(f, "strength") !== "balanced",
      q: "How do I fix a {strength} brew?",
      a: (f) =>
        `For ${fact2(f, "method")}, aim for the recommended 1:${fact2(f, "recMin")}–${fact2(f, "recMax")}. With ${fact2(f, "coffee")} of coffee that means about ${fact2(f, "targetWater")} of water — adjust from there.`
    },
    {
      when: (f) => fact2(f, "yield") !== "",
      q: "What yield should a {shots}-shot {style} pull give me?",
      a: (f) =>
        `At ${fact2(f, "style")}, each ${fact2(f, "coffee")} shot yields about ${fact2(f, "yield")} — for ${fact2(f, "shots")} shot(s) that's ${fact2(f, "totalYield")}. Pull time target: 25–30 s.`
    }
  ],

  "grams-cups-converter": [
    {
      when: (f) => fact2(f, "grams") !== "",
      q: "How many grams is {amount} {unit} of {ingredient}?",
      a: (f) =>
        `${fact2(f, "grams")} — at ${fact2(f, "density")} per US cup.`
    },
    {
      when: (f) => fact2(f, "density") !== "",
      q: "Why does {ingredient} weigh {density} per cup and not 240 g?",
      a: (f) =>
        `Because density varies: a cup of ${fact2(f, "ingredient")} really does weigh ${fact2(f, "density")}. The 240 g-per-cup shortcut is only true for water — that's why weighing beats measuring for baking.`
    },
    {
      when: (f) => fact2(f, "grams") !== "",
      q: "Should I always weigh {ingredient} instead of measuring cups?",
      a: (f) =>
        `For baking, yes. Flour settles in its bag, so a “cup” can vary by 20%+ depending on how you scoop — ${fact2(f, "grams")} is the number you can trust every time.`
    }
  ],

  "meat-doneness-guide": [
    {
      when: (f) => fact2(f, "tempF") !== "",
      q: "What's the target temperature for {meat} at {doneness}?",
      a: (f) =>
        `${fact2(f, "tempF")} / ${fact2(f, "tempC")} in the thickest part, away from bone. Pull it about 5°F early — carryover cooking adds heat during the rest.`
    },
    {
      when: (f) => fact2(f, "safeMinF") !== "",
      q: "What's the absolute safety minimum for {meat}?",
      a: (f) =>
        `USDA's safe minimum is ${fact2(f, "safeMinF")} — go below that only with full awareness, and remember poultry must always reach its minimum.`
    },
    {
      when: (f) => fact2(f, "rest") !== "",
      q: "How long should {meat} rest?",
      a: (f) =>
        `Rest for ${fact2(f, "rest")} before carving — the juices redistribute and the center keeps cooking a little more.`
    }
  ],

  "food-shelf-life": [
    {
      when: (f) => fact2(f, "expiry") !== "",
      q: "When does my {food} expire in the {storage}?",
      a: (f) =>
        `Use it by ${fact2(f, "expiry")} — that's ${fact2(f, "remaining")} from today, and it's currently ${fact2(f, "status")}.`
    },
    {
      when: (f) => fact2(f, "days") !== "",
      q: "Is {food} still OK if it smells fine?",
      a: (f) =>
        `${fact2(f, "food")} keeps ${fact2(f, "days")} in the ${fact2(f, "storage")} — smell and look are good final checks, but past that window the risk climbs even if nothing looks off.`
    },
    {
      when: (f) => fact2(f, "freezerDays") !== "",
      q: "Can I freeze {food} to make it last longer?",
      a: (f) =>
        `Yes — frozen ${fact2(f, "food")} keeps about ${fact2(f, "freezerDays")}, though freezing affects texture over time. Freeze it before the use-by date, not after.`
    }
  ],

  "measurement-to-weight": [
    {
      when: (f) => fact2(f, "total") !== "",
      q: "How much do my ingredients weigh in total?",
      a: (f) =>
        `All ${fact2(f, "count")} of your ingredients add up to ${fact2(f, "total")} (${fact2(f, "totalKg")}).`
    },
    {
      when: (f) => fact2(f, "total") !== "",
      q: "Why should I convert my recipe to grams?",
      a: (f) =>
        `Because “1 cup” of flour can be 110 g or 140 g depending on how you scoop. Your converted list removes that guesswork — ${fact2(f, "total")} is exact and repeatable every time you bake.`
    },
    {
      when: (f) => fact2(f, "top") !== "",
      q: "Which ingredient weighs the most in my recipe?",
      a: (f) =>
        `${fact2(f, "top")} contributes the most weight to the total of ${fact2(f, "total")}.`
    }
  ]
};
