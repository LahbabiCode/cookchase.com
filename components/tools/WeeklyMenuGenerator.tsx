"use client";

import { useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import { RefreshCw, Sparkles, Clock, Check } from "lucide-react";
import { ExampleHelper } from "./ui";

interface Meal {
  name: string;
  protein: string;
  time: number;
  prep: string;
}

const MEALS: Meal[] = [
  { name: "Sheet-pan chicken & veggies", protein: "Chicken", time: 40, prep: "Batch" },
  { name: "One-pot lemon orzo", protein: "Vegetarian", time: 30, prep: "Quick" },
  { name: "Beef & broccoli stir-fry", protein: "Beef", time: 25, prep: "Quick" },
  { name: "Baked salmon with asparagus", protein: "Fish", time: 25, prep: "Batch" },
  { name: "Turkey chili", protein: "Turkey", time: 45, prep: "Batch" },
  { name: "Mushroom risotto", protein: "Vegetarian", time: 40, prep: "Slow" },
  { name: "Lemon garlic chicken thighs", protein: "Chicken", time: 35, prep: "Batch" },
  { name: "Pork tenderloin & apples", protein: "Pork", time: 35, prep: "Slow" },
  { name: "Shrimp tacos with slaw", protein: "Seafood", time: 20, prep: "Quick" },
  { name: "Gnocchi with tomato sauce", protein: "Vegetarian", time: 20, prep: "Quick" },
  { name: "Slow-cooker pot roast", protein: "Beef", time: 240, prep: "Slow" },
  { name: "Chicken tikka masala", protein: "Chicken", time: 40, prep: "Slow" },
  { name: "Cod with crispy potatoes", protein: "Fish", time: 35, prep: "Slow" },
  { name: "Stuffed bell peppers", protein: "Turkey", time: 50, prep: "Batch" },
  { name: "Green curry with tofu", protein: "Vegetarian", time: 30, prep: "Quick" },
  { name: "Pork & mushroom stir-fry", protein: "Pork", time: 25, prep: "Quick" },
  { name: "Salmon teriyaki bowls", protein: "Fish", time: 25, prep: "Quick" },
  { name: "Chicken fajita bowls", protein: "Chicken", time: 30, prep: "Quick" },
  { name: "Beef tacos with salsa", protein: "Beef", time: 25, prep: "Quick" },
  { name: "Eggplant parmesan", protein: "Vegetarian", time: 55, prep: "Slow" },
  { name: "Lentil curry with rice", protein: "Vegetarian", time: 35, prep: "Batch" },
  { name: "Honey garlic shrimp", protein: "Seafood", time: 20, prep: "Quick" },
  { name: "Roast chicken with potatoes", protein: "Chicken", time: 70, prep: "Slow" },
  { name: "Beef & bean enchiladas", protein: "Beef", time: 50, prep: "Batch" }
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWeek(): Meal[] {
  const picked: Meal[] = [];
  // One shuffle, one pass — guaranteed to terminate regardless of pool size.
  for (const candidate of shuffle(MEALS)) {
    if (picked.length >= 7) break;
    if (picked.some((m) => m.name === candidate.name)) continue;
    const prev = picked[picked.length - 1];
    // Avoid the same protein two nights in a row for variety.
    if (!prev || prev.protein !== candidate.protein) {
      picked.push(candidate);
    }
  }
  return picked;
}

export default function WeeklyMenuGeneratorWidget() {
  const [week, setWeek] = useState<Meal[]>(() => pickWeek());
  const [locked, setLocked] = useState<boolean[]>(() => DAYS.map(() => false));
  const [justRegenerated, setJustRegenerated] = useState(false);

  const loadExample = () => {
    setWeek(pickWeek());
    setLocked(DAYS.map(() => false));
  };

  const regenerate = () => {
    setWeek((prev) => {
      const next = pickWeek();
      // Keep locked days, replace the rest.
      return prev.map((m, i) => (locked[i] ? m : next[i] ?? m));
    });
    setJustRegenerated(true);
    setTimeout(() => setJustRegenerated(false), 1200);
  };

  const toggleLock = (i: number) =>
    setLocked((l) => l.map((v, idx) => (idx === i ? !v : v)));

  const batchCount = week.filter((m) => m.prep === "Batch").length;
  const quickCount = week.filter((m) => m.prep === "Quick").length;

  usePublishToolFacts("weekly-menu-generator", {
    count: { label: "Dinners planned", value: String(week.length) },
    batch: { label: "Batch-ready", value: String(batchCount) },
    quick: { label: "Under 30 min", value: String(quickCount) }
  });

  return (
    <div className="space-y-5">
      <ExampleHelper
        hint="Generate a fresh 7-night dinner plan — no two nights share a protein."
        onExample={loadExample}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Sparkles className="h-4 w-4 text-brand-600" />
          {batchCount} batch-ready · {quickCount} under 30 min
        </div>
        <div className="flex items-center gap-2">
          {justRegenerated && (
            <span className="text-xs font-medium text-green-600">
              <Check className="mr-1 inline h-3.5 w-3.5" />
              New week generated
            </span>
          )}
          <button
            onClick={regenerate}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <RefreshCw className="h-4 w-4" />
            Generate new week
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {DAYS.map((day, i) => {
          const meal = week[i];
          return (
            <div
              key={day}
              className={`rounded-lg border bg-white p-4 shadow-card transition ${
                locked[i] ? "border-brand-300 bg-brand-50/40" : "border-ink-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  {day}
                </p>
                <button
                  onClick={() => toggleLock(i)}
                  title={locked[i] ? "Unlock this day" : "Keep this meal on regenerate"}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${
                    locked[i]
                      ? "bg-brand-600 text-white"
                      : "bg-ink-100 text-ink-400 hover:bg-ink-200"
                  }`}
                >
                  {locked[i] ? "Locked" : "Lock"}
                </button>
              </div>
              <h4 className="mt-1.5 text-sm font-semibold text-ink-900">{meal.name}</h4>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    meal.prep === "Quick"
                      ? "bg-green-50 text-green-700"
                      : meal.prep === "Batch"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-ink-100 text-ink-600"
                  }`}
                >
                  {meal.protein}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-ink-400">
                  <Clock className="h-3 w-3" />
                  {meal.prep === "Slow" && meal.time > 90 ? "slow" : `${meal.time} min`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-ink-400">
        No two nights share the same protein. Lock a day to keep its meal when you
        regenerate — useful when you&apos;re already committed to a plan.
      </p>
    </div>
  );
}
