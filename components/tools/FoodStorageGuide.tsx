"use client";

import { useMemo, useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import { Search } from "lucide-react";
import { ExampleHelper, getToolExample, exStr } from "./ui";

interface Food {
  name: string;
  pantry: string;
  fridge: string;
  freezer: string;
  note: string;
}

const FOODS: Food[] = [
  { name: "Eggs (shell)", pantry: "2–3 weeks (cool, unwashed)", fridge: "3–5 weeks", freezer: "1 year (raw, out of shell)", note: "Trust smell & appearance when cracked." },
  { name: "Chicken (raw)", pantry: "2 hours max", fridge: "1–2 days", freezer: "9–12 months", note: "Wash nothing — cook thoroughly to 74°C." },
  { name: "Ground beef", pantry: "2 hours max", fridge: "1–2 days", freezer: "3–4 months", note: "Cook to 71°C." },
  { name: "Steak / roast beef", pantry: "2 hours max", fridge: "3–5 days", freezer: "6–12 months", note: "Steaks can rest in the fridge for a dry-brine effect." },
  { name: "Pork chops / loin", pantry: "2 hours max", fridge: "3–5 days", freezer: "4–6 months", note: "Cook to 63°C + 3 min rest." },
  { name: "Fish (fresh)", pantry: "1–2 hours max", fridge: "1–2 days", freezer: "3–8 months", note: "Store on ice in the fridge for best quality." },
  { name: "Shrimp", pantry: "2 hours max", fridge: "1–2 days", freezer: "3–6 months", note: "Raw shrimp last longest." },
  { name: "Milk", pantry: "2 hours", fridge: "5–7 days", freezer: "3 months (texture changes)", note: "Freeze for cooking, not drinking." },
  { name: "Butter", pantry: "1–2 days", fridge: "1–3 months", freezer: "6–9 months", note: "Salted butter lasts longer." },
  { name: "Hard cheese", pantry: "—", fridge: "3–4 weeks opened", freezer: "6 months (grate first)", note: "Trim mold with a generous margin — it's safe." },
  { name: "Soft cheese", pantry: "—", fridge: "1–2 weeks opened", freezer: "— (turns grainy)", note: "Discard if moldy." },
  { name: "Yogurt", pantry: "2 hours", fridge: "2–3 weeks", freezer: "1–2 months (stir after thaw)", note: "Separation is normal; stir it back." },
  { name: "Leafy greens", pantry: "—", fridge: "3–7 days", freezer: "blanch first, 8–12 months", note: "Store dry in a loose bag with a paper towel." },
  { name: "Tomatoes", pantry: "5–7 days (ripe)", fridge: "1–2 weeks (less flavor)", freezer: "2–3 months (for cooking)", note: "Never refrigerate unripe tomatoes." },
  { name: "Potatoes", pantry: "1–2 months (cool, dark)", fridge: "— (starch turns sweet)", freezer: "cook first, then 10–12 months", note: "Keep away from onions — they spoil each other." },
  { name: "Onions & garlic", pantry: "1–2 months", fridge: "—", freezer: "3–6 months (chopped)", note: "Sprouting is fine; mush is not." },
  { name: "Carrots", pantry: "—", fridge: "3–4 weeks", freezer: "blanch first, 10–12 months", note: "Trim greens to slow spoilage." },
  { name: "Berries", pantry: "—", fridge: "3–7 days", freezer: "6–12 months (single layer first)", note: "Don't wash until just before eating." },
  { name: "Apples", pantry: "1–2 weeks (cool)", fridge: "4–6 weeks", freezer: "sliced, 8 months", note: "One bad apple genuinely does spoil the barrel." },
  { name: "Bananas", pantry: "5–7 days", fridge: "ripened: 3–5 days", freezer: "peeled, 2–3 months", note: "Brown bananas are perfect for baking." },
  { name: "Avocados", pantry: "3–5 days (to ripen)", fridge: "ripe: 2–3 days", freezer: "mashed, 3–6 months", note: "Lemon juice slows browning of cut halves." },
  { name: "Cooked rice", pantry: "2 hours", fridge: "3–4 days", freezer: "1–2 months", note: "Reheat rice to steaming hot — Bacillus risk." },
  { name: "Cooked pasta", pantry: "2 hours", fridge: "3–5 days", freezer: "2–3 months", note: "Toss with a little oil before freezing." },
  { name: "Soups & stews", pantry: "2 hours", fridge: "3–4 days", freezer: "2–3 months", note: "Cool in a shallow container, then refrigerate." },
  { name: "Deli meats", pantry: "2 hours", fridge: "3–5 days opened", freezer: "1–2 months", note: "High-risk — follow dates closely." },
  { name: "Hummus / dips", pantry: "—", fridge: "3–7 days opened", freezer: "—", note: "Discard if liquid separates and smells sour." },
  { name: "Flour (white)", pantry: "6–8 months (cool, sealed)", fridge: "—", freezer: "1–2 years", note: "Whole-grain flour goes rancid faster — freeze it." },
  { name: "Rice (dry)", pantry: "1–2 years (sealed)", fridge: "—", freezer: "—", note: "Store in airtight to repel weevils." },
  { name: "Pasta (dry)", pantry: "1–2 years", fridge: "—", freezer: "—", note: "Shelf-stable indefinitely if dry & sealed." },
  { name: "Honey", pantry: "2+ years", fridge: "— (crystallizes)", freezer: "—", note: "Crystallized honey is fine — warm it gently." },
  { name: "Coffee beans", pantry: "2–4 weeks (sealed)", fridge: "— (absorbs odors)", freezer: "up to 3 months", note: "Grind just before brewing for best flavor." },
  { name: "Olive oil", pantry: "6–12 months (dark, cool)", fridge: "— (clouds, fine)", freezer: "—", note: "Rancid oil smells waxy; taste before using." },
  { name: "Canned goods", pantry: "1–5 years", fridge: "after opening: 3–4 days", freezer: "—", note: "Discard any can that's bulged or leaking." },
  { name: "Bread (bakery)", pantry: "2–3 days", fridge: "— (stales faster)", freezer: "3–6 months", note: "Freeze sliced; toast straight from frozen." }
];

export default function FoodStorageGuideWidget() {
  const [query, setQuery] = useState("");

  const loadExample = () => {
    const v = getToolExample("food-storage-guide").values;
    setQuery(exStr(v, "query", "chicken"));
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FOODS.slice(0, 8);
    return FOODS.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const first = results[0];
  usePublishToolFacts("food-storage-guide", {
    food: { label: "Food", value: first?.name || query.trim() },
    pantry: { label: "Pantry", value: first?.pantry || "—" },
    fridge: { label: "Fridge", value: first?.fridge || "—" },
    freezer: { label: "Freezer", value: first?.freezer || "—" },
    note: { label: "Warning sign", value: first?.note || "" }
  });

  return (
    <div className="space-y-5">
      <ExampleHelper
        hint="Search how long chicken, milk or rice keeps — pantry, fridge and freezer."
        onExample={loadExample}
      />
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods… (try 'chicken', 'milk', 'rice')"
          className="w-full rounded-md border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm transition placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {results.map((f) => (
          <div key={f.name} className="rounded-lg border border-ink-200 bg-white p-4 shadow-card">
            <h4 className="text-sm font-semibold text-ink-900">{f.name}</h4>
            <div className="mt-2 space-y-1.5 text-xs">
              {f.pantry && (
                <div className="flex justify-between gap-3">
                  <span className="text-ink-400">Pantry</span>
                  <span className="text-right font-medium text-ink-700">{f.pantry}</span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-ink-400">Fridge</span>
                <span className="text-right font-medium text-ink-700">{f.fridge}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-400">Freezer</span>
                <span className="text-right font-medium text-ink-700">{f.freezer}</span>
              </div>
            </div>
            <p className="mt-2 border-t border-ink-100 pt-2 text-xs leading-relaxed text-ink-500">
              {f.note}
            </p>
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <p className="rounded-lg bg-ink-50 p-4 text-center text-sm text-ink-500">
          No food matched “{query}” — try a simpler term.
        </p>
      )}

      <p className="text-xs text-ink-400">
        Based on USDA food-safety guidelines. Fridge at or below 4°C; freezer at −18°C.
      </p>
    </div>
  );
}
