"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Field, ResultCard, CopyButton, ExampleHelper, fmt, getToolExample, exNum } from "./ui";
import { usePublishToolFacts } from "./faqStore";

interface MealDef {
  key: string;
  label: string;
  items: string[];
  batchable: boolean;
  /** Calories per serving */
  kcal: number;
  /** Protein grams per serving */
  protein: number;
  /** Cost per serving in USD */
  cost: number;
  /** Rough meal slot used to build balanced days */
  slot: "breakfast" | "main";
  /** Protein family used to rotate variety across the week */
  tag: string;
}

const MEALS: MealDef[] = [
  {
    key: "oats",
    label: "Overnight oats",
    items: ["Rolled oats 80g", "Milk 200ml", "Greek yogurt 100g", "Berries 50g"],
    batchable: true,
    kcal: 420,
    protein: 24,
    cost: 1.8,
    slot: "breakfast",
    tag: "Dairy"
  },
  {
    key: "eggwrap",
    label: "Egg & veggie wrap",
    items: ["Eggs ×2", "Whole-wheat tortilla", "Spinach 30g", "Feta 30g"],
    batchable: false,
    kcal: 380,
    protein: 22,
    cost: 1.9,
    slot: "breakfast",
    tag: "Egg"
  },
  {
    key: "chickenbowl",
    label: "Chicken rice bowl",
    items: ["Chicken breast 180g", "Rice 90g (dry)", "Broccoli 150g", "Olive oil 10ml"],
    batchable: true,
    kcal: 620,
    protein: 48,
    cost: 3.4,
    slot: "main",
    tag: "Chicken"
  },
  {
    key: "salmon",
    label: "Salmon + quinoa",
    items: ["Salmon fillet 150g", "Quinoa 70g (dry)", "Asparagus 120g", "Lemon"],
    batchable: true,
    kcal: 540,
    protein: 40,
    cost: 4.6,
    slot: "main",
    tag: "Fish"
  },
  {
    key: "pasta",
    label: "Turkey bolognese",
    items: ["Turkey mince 150g", "Pasta 100g (dry)", "Passata 200ml", "Onion 50g", "Parmesan 20g"],
    batchable: true,
    kcal: 640,
    protein: 38,
    cost: 3.1,
    slot: "main",
    tag: "Turkey"
  },
  {
    key: "stirfry",
    label: "Veggie stir-fry",
    items: ["Tofu 150g", "Rice noodles 80g", "Mixed veg 200g", "Soy sauce 15ml"],
    batchable: false,
    kcal: 450,
    protein: 26,
    cost: 2.8,
    slot: "main",
    tag: "Tofu"
  },
  {
    key: "thai",
    label: "Thai chicken curry",
    items: ["Chicken thigh 180g", "Coconut milk 200ml", "Curry paste 30g", "Jasmine rice 90g"],
    batchable: true,
    kcal: 660,
    protein: 40,
    cost: 3.8,
    slot: "main",
    tag: "Chicken"
  },
  {
    key: "shakshuka",
    label: "Shakshuka",
    items: ["Eggs ×2", "Passata 200ml", "Pepper 80g", "Onion 50g", "Pita bread"],
    batchable: false,
    kcal: 400,
    protein: 22,
    cost: 2.2,
    slot: "main",
    tag: "Egg"
  },
  {
    key: "burrito",
    label: "Black bean burritos",
    items: ["Black beans 150g", "Rice 80g", "Tortilla ×2", "Cheese 40g", "Salsa 50g"],
    batchable: true,
    kcal: 560,
    protein: 24,
    cost: 2.6,
    slot: "main",
    tag: "Beans"
  },
  {
    key: "soup",
    label: "Lentil soup",
    items: ["Lentils 120g", "Carrot 100g", "Onion 60g", "Stock 500ml", "Cumin 5g"],
    batchable: true,
    kcal: 380,
    protein: 20,
    cost: 1.5,
    slot: "main",
    tag: "Lentils"
  }
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EMPTY_WEEK: Record<string, string[]> = Object.fromEntries(
  DAYS.map((d) => [d, []])
);

/** Breakfast options used to start every generated day. */
const BREAKFASTS = MEALS.filter((m) => m.slot === "breakfast");
/** Main options used to fill the rest of the day. */
const MAINS = MEALS.filter((m) => m.slot === "main");

/**
 * Builds a full week of meals that lands near the calorie goal while staying
 * inside the daily budget. Strategy:
 *  - each day starts with a breakfast (rotated so it isn't repeated daily),
 *  - mains are then added — preferring batchable dishes and rotating protein
 *    families so the week stays varied (chicken, fish, turkey, tofu, beans…),
 *  - a day is "full" once it reaches ~90% of the calorie goal or the budget
 *    is spent.
 */
function generatePlan(
  dayCount: number,
  calGoal: number,
  budget: number
): Record<string, string[]> {
  const week: Record<string, string[]> = { ...EMPTY_WEEK };
  const usage: Record<string, number> = {};
  const tagUsage: Record<string, number> = {};

  const active = DAYS.slice(0, dayCount);

  active.forEach((day) => {
    const picked: string[] = [];
    const dayTags = new Set<string>();
    let kcal = 0;
    let spent = 0;

    const addMeal = (key: string) => {
      const meal = MEALS.find((m) => m.key === key);
      if (!meal) return;
      picked.push(key);
      kcal += meal.kcal;
      spent += meal.cost;
      usage[key] = (usage[key] || 0) + 1;
      tagUsage[meal.tag] = (tagUsage[meal.tag] || 0) + 1;
      dayTags.add(meal.tag);
    };

    // 1) Breakfast — pick the least-used one that still fits the budget.
    const breakfast = [...BREAKFASTS].sort(
      (a, b) => (usage[a.key] || 0) - (usage[b.key] || 0)
    )[0];
    if (breakfast && spent + breakfast.cost <= budget) addMeal(breakfast.key);

    // 2) Mains — fill until we hit ~90% of the calorie goal or run out of budget.
    //    Guards: never repeat a meal on the same day, avoid the same protein
    //    family twice on one day (dayTags), and prefer meals used less across
    //    the week so the whole week stays varied. Cap at 4 mains.
    while (picked.length < 5 && kcal < calGoal * 0.9 && spent <= budget) {
      const candidates = MAINS.filter(
        (m) =>
          !picked.includes(m.key) &&
          !dayTags.has(m.tag) &&
          spent + m.cost <= budget
      );
      if (candidates.length === 0) break;

      candidates.sort((a, b) => {
        const fit = calGoal * 0.9 - kcal;
        const scoreA =
          (usage[a.key] || 0) * 10 +
          (tagUsage[a.tag] || 0) * 3 +
          (a.batchable ? 0 : 2) +
          Math.abs(a.kcal - fit) / 200;
        const scoreB =
          (usage[b.key] || 0) * 10 +
          (tagUsage[b.tag] || 0) * 3 +
          (b.batchable ? 0 : 2) +
          Math.abs(b.kcal - fit) / 200;
        return scoreA - scoreB;
      });
      addMeal(candidates[0].key);
    }

    week[day] = picked;
  });

  return week;
}

export default function MealPrepPlannerWidget() {
  const [days, setDays] = useState(5);
  const [calGoal, setCalGoal] = useState(2000);
  const [budget, setBudget] = useState(30);
  const [generated, setGenerated] = useState(false);
  const [plan, setPlan] = useState<Record<string, string[]>>({ ...EMPTY_WEEK });

  const activeDays = DAYS.slice(0, days);

  const toggle = (day: string, mealKey: string) => {
    setGenerated(false);
    setPlan((p) => {
      const cur = p[day] || [];
      return {
        ...p,
        [day]: cur.includes(mealKey)
          ? cur.filter((k) => k !== mealKey)
          : [...cur, mealKey]
      };
    });
  };

  const totals = useMemo(() => {
    const itemTotals: Record<string, { count: number; batchable: boolean }> = {};
    activeDays.forEach((d) => {
      (plan[d] || []).forEach((key) => {
        const meal = MEALS.find((m) => m.key === key);
        if (!meal) return;
        meal.items.forEach((item) => {
          itemTotals[item] = {
            count: (itemTotals[item]?.count || 0) + 1,
            batchable: meal.batchable || itemTotals[item]?.batchable
          };
        });
      });
    });
    return itemTotals;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, days]);

  // Weekly nutrition/cost summary across the active (planned) days.
  const summary = useMemo(() => {
    let kcal = 0;
    let cost = 0;
    let protein = 0;
    let mealCount = 0;
    const tags = new Set<string>();
    DAYS.slice(0, days).forEach((d) => {
      (plan[d] || []).forEach((key) => {
        const meal = MEALS.find((m) => m.key === key);
        if (!meal) return;
        kcal += meal.kcal;
        cost += meal.cost;
        protein += meal.protein;
        mealCount += 1;
        tags.add(meal.tag);
      });
    });
    return { kcal, cost, protein, mealCount, variety: tags.size };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, days]);

  const loadExample = () => {
    const v = getToolExample("meal-prep-planner").values;
    setGenerated(false);
    setDays(exNum(v, "days", 5));
    setCalGoal(exNum(v, "calGoal", 2000));
    setBudget(exNum(v, "budget", 30));
    setPlan({ ...EMPTY_WEEK, Mon: ["oats", "chickenbowl"], Tue: ["eggwrap", "pasta"], Wed: ["oats", "stirfry"], Thu: ["chickenbowl", "soup"], Fri: ["salmon", "thai"] });
  };

  const onGenerate = () => {
    setPlan(generatePlan(days, calGoal, budget));
    setGenerated(true);
  };

  const selectedCount = activeDays.reduce((s, d) => s + (plan[d] || []).length, 0);

  usePublishToolFacts("meal-prep-planner", {
    days: { label: "Days planned", value: String(days) },
    calGoal: { label: "Calorie goal", value: `${calGoal} kcal/day` },
    budget: { label: "Weekly budget", value: `$${budget}` },
    mealsCount: { label: "Meal slots", value: String(selectedCount) },
    kcalPerDay: { label: "Calories per day", value: `${calGoal} kcal` }
  });

  const copyText = activeDays
    .map((d) => `${d}: ${(plan[d] || []).map((k) => MEALS.find((m) => m.key === k)?.label).join(", ") || "—"}`)
    .join("\n");

  return (
    <div className="space-y-6">
      <ExampleHelper
        hint="Press Generate plan with a 2,000 kcal goal to see a full balanced week appear below."
        onExample={loadExample}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Week length">
          <div className="grid grid-cols-2 gap-1 rounded-md border border-ink-200 p-1">
            {[5, 7].map((n) => (
              <button
                key={n}
                onClick={() => setDays(n)}
                className={`rounded px-4 py-1.5 text-sm font-medium transition ${
                  days === n ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                {n} days
              </button>
            ))}
          </div>
        </Field>
        <Field label="Calorie goal per day">
          <div className="rounded-md border border-ink-200 bg-white px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="readout text-sm font-bold text-brand-700">{fmt(calGoal, 0)}</span>
              <span className="text-xs text-ink-400">kcal</span>
            </div>
            <input
              type="range"
              min={1400}
              max={3000}
              step={50}
              value={calGoal}
              onChange={(e) => setCalGoal(Number(e.target.value))}
              className="mt-1.5 w-full accent-brand-600"
              aria-label="Calorie goal per day"
            />
          </div>
        </Field>
        <Field label="Daily budget">
          <div className="rounded-md border border-ink-200 bg-white px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="readout text-sm font-bold text-brand-700">${fmt(budget, 0)}</span>
              <span className="text-xs text-ink-400">/ day</span>
            </div>
            <input
              type="range"
              min={15}
              max={50}
              step={1}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="mt-1.5 w-full accent-brand-600"
              aria-label="Daily food budget"
            />
          </div>
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onGenerate}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            <Sparkles className="h-4 w-4" />
            Generate plan
          </button>
          {generated && (
            <span className="text-xs font-medium text-green-600">
              Balanced week generated for {days} days
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-500">
            {selectedCount} meal{selectedCount === 1 ? "" : "s"} planned
          </span>
          <CopyButton text={copyText} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-ink-200 pb-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                    Day
                  </th>
                  {MEALS.map((m) => (
                    <th
                      key={m.key}
                      className="border-b border-ink-200 pb-2 text-center text-[11px] font-medium text-ink-500"
                      title={`${m.label} — ${m.kcal} kcal, $${m.cost}`}
                    >
                      {m.label.length > 12 ? m.label.split(" ")[0] : m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeDays.map((d) => (
                  <tr key={d} className="group">
                    <td className="border-b border-ink-100 py-1.5 pr-2 text-xs font-semibold text-ink-700">
                      {d}
                    </td>
                    {MEALS.map((m) => (
                      <td key={m.key} className="border-b border-ink-100 py-1.5 text-center">
                        <button
                          onClick={() => toggle(d, m.key)}
                          aria-label={`${d} ${m.label}`}
                          aria-pressed={(plan[d] || []).includes(m.key)}
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-md border text-sm transition ${
                            (plan[d] || []).includes(m.key)
                              ? "border-brand-500 bg-brand-600 text-white"
                              : "border-ink-200 text-transparent hover:border-brand-300 hover:text-brand-300"
                          }`}
                        >
                          ✓
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-ink-400">
            Tap the squares to assign meals to days, or let Generate plan build a balanced week.
            Meals marked “batch” can be prepped ahead.
          </p>
        </div>

        <div className="space-y-4">
          <ResultCard title="Combined shopping list">
            {Object.keys(totals).length === 0 ? (
              <p className="text-sm text-brand-200/80">Select some meals to build your list.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto pr-1">
                {Object.entries(totals).map(([item, { count, batchable }]) => (
                  <div
                    key={item}
                    className="flex items-center justify-between gap-3 border-b border-white/10 py-2 text-sm last:border-0"
                  >
                    <span className="text-brand-100">
                      {item}
                      {batchable && (
                        <span className="ml-2 rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-100">
                          batch
                        </span>
                      )}
                    </span>
                    <span className="readout font-semibold text-copper-200">×{fmt(count, 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </ResultCard>

          <ResultCard
            title="Your week at a glance"
            note={
              generated
                ? activeDays.length > 0 &&
                  summary.kcal / activeDays.length < calGoal * 0.85
                  ? `This plan averages below your ${fmt(calGoal, 0)} kcal goal — add another meal on some days or raise the budget.`
                  : "Built by the planner to fit your goals — swap any meal you like."
                : "Generate a plan or pick meals to see weekly totals."
            }
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-200/70">Avg / day</p>
                <p className="readout mt-1 text-lg font-bold text-copper-200">
                  {activeDays.length ? fmt(summary.kcal / activeDays.length, 0) : "0"} kcal
                </p>
                <p className="mt-0.5 text-[11px] text-brand-200/70">
                  goal {fmt(calGoal, 0)} kcal
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-200/70">Avg / day</p>
                <p className="readout mt-1 text-lg font-bold text-copper-200">
                  ${fmt(activeDays.length ? summary.cost / activeDays.length : 0, 2)}
                </p>
                <p className="mt-0.5 text-[11px] text-brand-200/70">
                  budget ${fmt(budget, 0)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-200/70">Protein / day</p>
                <p className="readout mt-1 text-lg font-bold text-copper-200">
                  {activeDays.length ? fmt(summary.protein / activeDays.length, 0) : "0"} g
                </p>
                <p className="mt-0.5 text-[11px] text-brand-200/70">
                  {summary.mealCount} meals planned
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-200/70">Variety</p>
                <p className="readout mt-1 text-lg font-bold text-copper-200">
                  {summary.variety}
                </p>
                <p className="mt-0.5 text-[11px] text-brand-200/70">
                  protein families
                </p>
              </div>
            </div>
          </ResultCard>
        </div>
      </div>
    </div>
  );
}
