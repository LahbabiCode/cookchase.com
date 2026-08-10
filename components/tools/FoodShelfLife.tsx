"use client";

import { useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import { Field, selectCls, ResultCard, ResultRow, ExampleHelper, fmt, getToolExample, exStr } from "./ui";
import { CalendarDays, Snowflake, AlertTriangle, Info } from "lucide-react";

interface Food {
  id: string;
  name: string;
  emoji: string;
  pantryDays: number; // days at room temp
  fridgeDays: number;
  freezerDays: number;
  note: string;
}

const FOODS: Food[] = [
  { id: "milk", name: "Milk (opened)", emoji: "🥛", pantryDays: 0.5, fridgeDays: 7, freezerDays: 90, note: "Trust the sniff test — milk is fine 3–5 days past the printed date if it smells clean." },
  { id: "eggs", name: "Eggs (shell)", emoji: "🥚", pantryDays: 14, fridgeDays: 42, freezerDays: 0, note: "Shell eggs keep 3–5 weeks past the pack date when refrigerated. Never freeze in shell." },
  { id: "raw-chicken", name: "Raw chicken", emoji: "🍗", pantryDays: 0.08, fridgeDays: 2, freezerDays: 270, note: "Raw poultry is safe 1–2 days refrigerated. Freeze it the day you buy it if not cooking soon." },
  { id: "raw-beef", name: "Raw beef / pork", emoji: "🥩", pantryDays: 0.08, fridgeDays: 4, freezerDays: 240, note: "Raw steaks and chops keep 3–4 days refrigerated. Ground meat only 1–2 days." },
  { id: "cooked-leftovers", name: "Cooked leftovers", emoji: "🍲", pantryDays: 0.08, fridgeDays: 4, freezerDays: 90, note: "The 4-day rule: cooked food is safe 3–4 days refrigerated at ≤4°C. Reheat to 74°C." },
  { id: "deli-meat", name: "Deli meat (opened)", emoji: "🥓", pantryDays: 0.08, fridgeDays: 5, freezerDays: 60, note: "Opened deli meat: 3–5 days. Closed packages last 2 weeks unopened." },
  { id: "fish", name: "Fresh fish", emoji: "🐟", pantryDays: 0.08, fridgeDays: 2, freezerDays: 90, note: "Fresh fish should be cooked within 1–2 days. Freeze for up to 3 months." },
  { id: "yogurt", name: "Yogurt (opened)", emoji: "🍶", pantryDays: 0.5, fridgeDays: 14, freezerDays: 60, note: "Opened yogurt: 1–2 weeks. Mold or a sour smell means it's time to go." },
  { id: "hard-cheese", name: "Hard cheese", emoji: "🧀", pantryDays: 1, fridgeDays: 60, freezerDays: 180, note: "Parmesan, cheddar etc. keep for weeks — trim mold 1 inch around and the rest is fine." },
  { id: "soft-cheese", name: "Soft cheese", emoji: "🧀", pantryDays: 0.5, fridgeDays: 14, freezerDays: 30, note: "Brie, feta, ricotta: 1–2 weeks opened. Discard if mold appears — it penetrates soft cheese." },
  { id: "butter", name: "Butter", emoji: "🧈", pantryDays: 7, fridgeDays: 90, freezerDays: 365, note: "Butter keeps 1–3 months refrigerated. Rancid butter smells like old paint." },
  { id: "bread", name: "Bread", emoji: "🍞", pantryDays: 5, fridgeDays: 10, freezerDays: 180, note: "Bread stales fastest in the fridge. Freeze sliced bread and toast straight from frozen." },
  { id: "berries", name: "Berries", emoji: "🫐", pantryDays: 1, fridgeDays: 5, freezerDays: 365, note: "Wash berries only right before eating — moisture grows mold fast." },
  { id: "lettuce", name: "Lettuce / greens", emoji: "🥬", pantryDays: 0.5, fridgeDays: 7, freezerDays: 0, note: "Dry greens in a paper towel keep a week. Never freeze — they turn to mush." },
  { id: "cooked-rice", name: "Cooked rice / pasta", emoji: "🍚", pantryDays: 0.08, fridgeDays: 4, freezerDays: 90, note: "Cooked grains: 3–4 days chilled. Reheat once, thoroughly." },
  { id: "open-wine", name: "Open wine", emoji: "🍷", pantryDays: 3, fridgeDays: 7, freezerDays: 0, note: "Red wine 3–5 days corked, white 3–7 days chilled. Cooking wine stays usable longer." },
  { id: "mayo", name: "Mayo / dressings", emoji: "🥫", pantryDays: 30, fridgeDays: 90, freezerDays: 0, note: "Unopened mayo lasts months in the pantry; once opened, refrigerate." },
  { id: "canned-goods", name: "Canned goods (opened)", emoji: "🥫", pantryDays: 0.08, fridgeDays: 5, freezerDays: 60, note: "Transfer opened canned food to a container — never store in the open can." }
];

type Storage = "pantry" | "fridge" | "freezer";

const STORAGE_LABEL: Record<Storage, string> = {
  pantry: "Pantry / counter",
  fridge: "Refrigerator",
  freezer: "Freezer"
};

export default function FoodShelfLifeWidget() {
  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);

  const [foodId, setFoodId] = useState("cooked-leftovers");
  const [storage, setStorage] = useState<Storage>("fridge");
  const [startDate, setStartDate] = useState(isoToday);

  const loadExample = () => {
    const v = getToolExample("food-shelf-life").values;
    setFoodId(exStr(v, "foodId", "raw-chicken"));
    setStorage(exStr(v, "storage", "fridge") as Storage);
    setStartDate(isoToday);
  };

  const food = FOODS.find((f) => f.id === foodId)!;
  const days = food[`${storage}Days` as keyof Food] as number;

  const start = new Date(startDate + "T00:00:00");
  const startValid = !isNaN(start.getTime());
  const expiry = startValid ? new Date(start.getTime() + days * 86400000) : null;

  // Days remaining from today
  const nowMs = today.getTime();
  const startMs = startValid ? start.getTime() : nowMs;
  const expMs = expiry ? expiry.getTime() : nowMs;
  const remaining = Math.round((expMs - nowMs) / 86400000);
  const age = Math.round((nowMs - startMs) / 86400000);

  const status =
    remaining > 3
      ? { label: "Fresh ✓", cls: "bg-green-50 text-green-700" }
      : remaining >= 0
        ? { label: `Use soon (${remaining} day${remaining === 1 ? "" : "s"} left)`, cls: "bg-amber-50 text-amber-700" }
        : { label: `Expired ${-remaining} day${-remaining === 1 ? "" : "s"} ago`, cls: "bg-red-50 text-red-600" };

  const fmtDate = (d: Date | null) =>
    d ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

  // Progress bar: how much of the shelf life has elapsed
  const pct = days > 0 ? Math.min(100, Math.max(0, (age / days) * 100)) : 0;

  usePublishToolFacts("food-shelf-life", {
    food: { label: "Food", value: food.name },
    storage: { label: "Storage", value: STORAGE_LABEL[storage].toLowerCase() },
    days: { label: "Shelf life", value: `${fmt(days, 1)} days` },
    expiry: { label: "Use by", value: fmtDate(expiry) },
    remaining: { label: "Days left", value: `${remaining} days` },
    status: { label: "Status", value: status.label },
    freezerDays: { label: "Freezer", value: `${fmt(food.freezerDays, 0)} days` }
  });

  return (
    <div className="space-y-6">
      <ExampleHelper
        hint="Check how long raw chicken lasts in the fridge — today's date, today's answer."
        onExample={loadExample}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Food">
          <select
            className={selectCls}
            value={foodId}
            onChange={(e) => setFoodId(e.target.value)}
          >
            {FOODS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.emoji} {f.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Storage">
          <select
            className={selectCls}
            value={storage}
            onChange={(e) => setStorage(e.target.value as Storage)}
          >
            {(Object.keys(STORAGE_LABEL) as Storage[]).map((s) => (
              <option key={s} value={s}>
                {STORAGE_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Stored / opened on"
        hint={`Today is ${fmtDate(today)}`}
      >
        <input
          type="date"
          value={startDate}
          max={isoToday}
          onChange={(e) => setStartDate(e.target.value)}
          className={selectCls}
        />
      </Field>

      <ResultCard title={`${food.name} — shelf life`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ResultRow
            label="Use by date"
            value={fmtDate(expiry)}
            sub={`${fmt(days, 1)} day${days !== 1 ? "s" : ""} in the ${STORAGE_LABEL[storage].toLowerCase()}`}
            strong
          />
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.cls}`}>
            {status.label}
          </span>
        </div>

        {/* Freshness bar */}
        <div className="mt-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full transition-all ${
                pct >= 100 ? "bg-red-500" : pct >= 60 ? "bg-amber-400" : "bg-green-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] font-medium uppercase tracking-wide text-brand-200/70">
            <span>Stored</span>
            <span>{fmt(age, 0)} day{age === 1 ? "" : "s"} elapsed</span>
            <span>Expires</span>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <ResultRow label="Pantry" value={`${fmt(food.pantryDays, 1)} days`} />
          <ResultRow label="Fridge" value={`${fmt(food.fridgeDays, 1)} days`} />
          <ResultRow label="Freezer" value={`${fmt(food.freezerDays, 0)} days`} />
        </div>
      </ResultCard>

      <div className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs text-ink-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
        <span>{food.note}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2 rounded-lg border border-ink-200 bg-white p-3 text-xs text-ink-500">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span>
            <strong className="text-ink-700">The 2-hour rule:</strong> perishable food left at room
            temperature over 2 hours (1 hour above 32°C) should be discarded — even if it looks fine.
          </span>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-ink-200 bg-white p-3 text-xs text-ink-500">
          <Snowflake className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
          <span>
            <strong className="text-ink-700">Freezing pauses, never cures.</strong> Frozen food stays
            safe indefinitely, but quality fades — the freezer days above are quality limits.
          </span>
        </div>
      </div>

      <p className="flex items-center justify-end gap-1.5 text-xs text-ink-400">
        <CalendarDays className="h-3.5 w-3.5" />
        Estimates are USDA-style guidelines — when in doubt, smell, look and taste.
      </p>
    </div>
  );
}
