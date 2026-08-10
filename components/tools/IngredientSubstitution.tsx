"use client";

import { useMemo, useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import { Search } from "lucide-react";
import { ExampleHelper, getToolExample, exStr } from "./ui";

interface Sub {
  name: string;
  ratio: string;
  note: string;
}

const DATA: Record<string, Sub[]> = {
  buttermilk: [
    { name: "Milk + lemon juice", ratio: "1 cup milk + 1 tbsp lemon juice", note: "Let sit 5 minutes before using" },
    { name: "Milk + white vinegar", ratio: "1 cup milk + 1 tbsp vinegar", note: "Works in pancakes, cakes & scones" },
    { name: "Yogurt thinned with milk", ratio: "¾ cup yogurt + ¼ cup milk", note: "Thickest option — best for waffles" }
  ],
  egg: [
    { name: "Flax egg", ratio: "1 tbsp ground flax + 3 tbsp water", note: "Let gel 10 min; good binder for cookies & muffins" },
    { name: "Applesauce", ratio: "¼ cup per egg", note: "Adds moisture; best in quick breads" },
    { name: "Mashed banana", ratio: "¼ cup per egg", note: "Adds sweetness — reduce sugar slightly" },
    { name: "Commercial egg replacer", ratio: "per package directions", note: "Most reliable all-round option" }
  ],
  "brown sugar": [
    { name: "White sugar + molasses", ratio: "1 cup white sugar + 1 tbsp molasses", note: "True brown sugar replacement" },
    { name: "Coconut sugar", ratio: "1:1", note: "Slightly less sweet, more caramel flavor" }
  ],
  butter: [
    { name: "Oil (neutral)", ratio: "¾ cup oil per 1 cup butter", note: "Tenderer crumb; good for cakes" },
    { name: "Coconut oil", ratio: "1:1 solid, ¾ cup melted", note: "Solid works in pie dough & cookies" },
    { name: "Applesauce (baking)", ratio: "½ cup per 1 cup butter", note: "Very low fat — texture changes" }
  ],
  "heavy cream": [
    { name: "Milk + butter", ratio: "¾ cup milk + ¼ cup melted butter", note: "Approximates 1 cup heavy cream" },
    { name: "Half-and-half", ratio: "1:1", note: "Fine for sauces; won't whip" }
  ],
  "sour cream": [
    { name: "Plain yogurt", ratio: "1:1", note: "Similar tang; slightly thinner" },
    { name: "Creme fraiche", ratio: "1:1", note: "Richer, less tangy" }
  ],
  "maple syrup": [
    { name: "Honey", ratio: "1:1 (reduce liquid 2–4 tbsp/cup)", note: "Honey is sweeter; lower oven 25°F" },
    { name: "Corn syrup", ratio: "1:1", note: "Less flavor — add vanilla" }
  ],
  "corn starch": [
    { name: "All-purpose flour", ratio: "2 tbsp flour per 1 tbsp cornstarch", note: "For thickening sauces" },
    { name: "Arrowroot", ratio: "1:1", note: "Clearer gloss, works at lower temps" }
  ],
  "baking powder": [
    { name: "Baking soda + cream of tartar", ratio: "¼ tsp soda + ½ tsp tartar + ¼ tsp starch per 1 tsp", note: "Make your own in a pinch" },
    { name: "Baking soda + acid", ratio: "¼ tsp soda + ½ tsp lemon juice per 1 tsp", note: "Use immediately" }
  ],
  "baking soda": [
    { name: "Baking powder (tripled)", ratio: "3 tsp powder per 1 tsp soda", note: "Reduces acid content in recipe; watch flavor" }
  ],
  honey: [
    { name: "Maple syrup", ratio: "1:1", note: "Lighter flavor, same sweetness" },
    { name: "Sugar (dry)", ratio: "¾ cup sugar + ¼ cup liquid per 1 cup honey", note: "Restore the liquid honey provides" }
  ],
  "olive oil": [
    { name: "Avocado oil", ratio: "1:1", note: "High smoke point, neutral — great for cooking" },
    { name: "Canola oil", ratio: "1:1", note: "Neutral; fine for baking" }
  ],
  "soy sauce": [
    { name: "Coconut aminos", ratio: "1:1", note: "Sweeter, less salty — add salt to taste" },
    { name: "Tamari", ratio: "1:1", note: "Gluten-free soy alternative" }
  ],
  "red wine": [
    { name: "Beef or vegetable stock + vinegar", ratio: "¾ cup stock + 1 tbsp red wine vinegar", note: "Adds body and acid without alcohol" },
    { name: "Pomegranate juice", ratio: "1:1", note: "Sweet-tart depth in braises" }
  ],
  "white wine": [
    { name: "Chicken stock + lemon juice", ratio: "¾ cup stock + 1 tbsp lemon juice", note: "Classic non-alcoholic swap" },
    { name: "Vermouth", ratio: "1:1", note: "Still alcoholic but different character" }
  ],
  "cream of tartar": [
    { name: "Lemon juice", ratio: "½ tsp juice per ¼ tsp tartar", note: "For stabilizing meringues" },
    { name: "White vinegar", ratio: "½ tsp per ¼ tsp", note: "Same acid role" }
  ],
  molasses: [
    { name: "Dark corn syrup + molasses flavor", ratio: "1:1", note: "Brown sugar depth without the bite" },
    { name: "Honey + dark brown sugar", ratio: "½ + ½ mix", note: "Good in gingerbread in a pinch" }
  ],
  "bread flour": [
    { name: "All-purpose flour", ratio: "1:1", note: "Slightly less chew; add 1 tsp vital gluten per cup for bread" },
    { name: "All-purpose + vital wheat gluten", ratio: "1 cup AP + 1 tsp gluten", note: "Mimics bread flour" }
  ],
  "self-rising flour": [
    { name: "AP flour + baking powder + salt", ratio: "1 cup AP + 1½ tsp baking powder + ¼ tsp salt", note: "Standard homemade replacement" }
  ],
  "cake flour": [
    { name: "All-purpose flour + cornstarch", ratio: "1 cup AP − 2 tbsp + 2 tbsp cornstarch", note: "Sift together 3× for lightness" }
  ],
  "fresh herbs": [
    { name: "Dried herbs", ratio: "1 tbsp fresh = 1 tsp dried", note: "Add dried earlier, fresh at the end" }
  ],
  garlic: [
    { name: "Garlic powder", ratio: "1 clove = ⅛ tsp powder", note: "Different flavor — softer, less sharp" },
    { name: "Granulated garlic", ratio: "1 clove = ¼ tsp", note: "Closer to fresh than powder" }
  ],
  "vanilla extract": [
    { name: "Vanilla bean", ratio: "1 tsp extract = 1 inch bean (split & scraped)", note: "Seeds add visual flecks" },
    { name: "Vanilla paste", ratio: "1:1", note: "Same flavor, more intense" }
  ]
};

export default function IngredientSubstitutionWidget() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("buttermilk");

  const loadExample = () => {
    const v = getToolExample("ingredient-substitution").values;
    setQuery(exStr(v, "query", "egg"));
    setSelected(exStr(v, "selected", "egg"));
  };

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return Object.keys(DATA).slice(0, 10);
    return Object.keys(DATA).filter((k) => k.includes(q)).slice(0, 10);
  }, [query]);

  const subs = DATA[selected] ?? [];

  usePublishToolFacts("ingredient-substitution", {
    selected: { label: "Ingredient to replace", value: selected },
    topSub: { label: "Top substitute", value: subs[0]?.name || "" },
    topRatio: { label: "Ratio", value: subs[0]?.ratio || "" }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <ExampleHelper
          hint="Find a swap for eggs when you're out — flax, applesauce or banana."
          onExample={loadExample}
        />
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (DATA[e.target.value.trim().toLowerCase()]) {
                setSelected(e.target.value.trim().toLowerCase());
              }
            }}
            placeholder="Search an ingredient… (try 'egg', 'butter', 'buttermilk')"
            className="w-full rounded-md border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm transition placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {matches.map((key) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                selected === key
                  ? "border-brand-500 bg-brand-600 text-white"
                  : "border-ink-200 bg-white text-ink-600 hover:border-brand-400"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold capitalize text-ink-800">
          Substitutes for {selected}
        </h3>
        {subs.length === 0 ? (
          <p className="rounded-lg bg-ink-50 p-4 text-sm text-ink-500">
            No entry yet for this ingredient — check the search for nearby terms.
          </p>
        ) : (
          subs.map((s, i) => (
            <div key={i} className="rounded-lg border border-ink-200 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-ink-900">{s.name}</h4>
              </div>
              <p className="mt-1.5 text-sm font-medium text-brand-700">Ratio: {s.ratio}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">{s.note}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
