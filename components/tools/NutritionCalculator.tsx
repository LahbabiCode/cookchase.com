"use client";

import { useMemo, useState } from "react";
import {
  Field,
  NumberInput,
  selectCls,
  ResultCard,
  ResultRow,
  AddRowButton,
  RemoveButton,
  ResetButton,
  ExampleHelper,
  useNumber,
  fmt,
  getToolExample,
  exStr,
  exArr
} from "./ui";
import ProToolActions from "./ProToolActions";
import { FOODS } from "./foodData";
import { usePublishToolFacts } from "./faqStore";

interface Row {
  food: string;
  grams: string;
}

export default function NutritionCalculatorWidget() {
  const [servings, setServings] = useState("4");
  const [rows, setRows] = useState<Row[]>([
    { food: "Chicken breast (raw)", grams: "600" },
    { food: "White rice (dry)", grams: "200" },
    { food: "Broccoli", grams: "300" },
    { food: "Olive oil", grams: "15" }
  ]);

  const loadExample = () => {
    const v = getToolExample("nutrition-calculator").values;
    setServings(exStr(v, "servings", "4"));
    setRows(
      exArr<Row>(v, "rows", [
        { food: "Chicken breast (raw)", grams: "600" },
        { food: "White rice (dry)", grams: "200" },
        { food: "Broccoli", grams: "300" },
        { food: "Olive oil", grams: "15" }
      ])
    );
  };

  const sv = useNumber(servings);
  const update = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const totals = useMemo(() => {
    const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    for (const r of rows) {
      const n = FOODS[r.food];
      if (!n) continue;
      const f = useNumber(r.grams) / 100;
      t.kcal += n.kcal * f;
      t.protein += n.protein * f;
      t.carbs += n.carbs * f;
      t.fat += n.fat * f;
      t.fiber += n.fiber * f;
    }
    return t;
  }, [rows]);

  const per = {
    kcal: sv > 0 ? totals.kcal / sv : 0,
    protein: sv > 0 ? totals.protein / sv : 0,
    carbs: sv > 0 ? totals.carbs / sv : 0,
    fat: sv > 0 ? totals.fat / sv : 0,
    fiber: sv > 0 ? totals.fiber / sv : 0
  };

  usePublishToolFacts("nutrition-calculator", {
    servings: { label: "Servings", value: fmt(sv, 0) },
    kcalTotal: { label: "Total calories", value: `${fmt(totals.kcal, 0)} kcal` },
    kcalPer: { label: "Calories per serving", value: `${fmt(per.kcal, 0)} kcal` },
    proteinPer: { label: "Protein per serving", value: `${fmt(per.protein, 1)} g` },
    carbsPer: { label: "Carbs per serving", value: `${fmt(per.carbs, 1)} g` },
    fatPer: { label: "Fat per serving", value: `${fmt(per.fat, 1)} g` }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <ExampleHelper
          hint="Count calories for a chicken, rice & broccoli dinner in 4 servings."
          onExample={loadExample}
        />
        <Field label="Number of servings">
          <NumberInput value={servings} onChange={setServings} min={1} />
        </Field>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_90px_auto] items-center gap-2">
              <select
                className={selectCls}
                value={row.food}
                onChange={(e) => update(i, { food: e.target.value })}
              >
                {Object.keys(FOODS).map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
              <div className="relative">
                <NumberInput value={row.grams} onChange={(v) => update(i, { grams: v })} />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-400">
                  g
                </span>
              </div>
              <RemoveButton onRemove={() => setRows((r) => r.filter((_, idx) => idx !== i))} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <AddRowButton
            onClick={() => setRows((r) => [...r, { food: "Egg (large)", grams: "100" }])}
          >
            Add ingredient
          </AddRowButton>
          <ResetButton onReset={() => setRows([])} />
        </div>
      </div>

      <ResultCard title="Per serving" note="Estimates based on USDA-style averages per 100 g (raw weights).">
        <ResultRow label="Calories" value={`${fmt(per.kcal, 0)} kcal`} strong />
        <ResultRow label="Protein" value={`${fmt(per.protein, 1)} g`} />
        <ResultRow label="Carbs" value={`${fmt(per.carbs, 1)} g`} />
        <ResultRow label="Fat" value={`${fmt(per.fat, 1)} g`} />
        <ResultRow label="Fiber" value={`${fmt(per.fiber, 1)} g`} />
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-copper-400 transition-all"
            style={{
              width: `${Math.min(100, (per.kcal / 600) * 100)}%`
            }}
          />
        </div>
        <p className="mt-1 text-[11px] text-brand-200/70">kcal vs. 600 kcal reference</p>
      </ResultCard>

      <ProToolActions
        toolSlug="nutrition-calculator"
        toolName="Nutrition Calculator"
        rows={[
          { label: "Servings", value: String(sv) },
          { label: "Calories / serving", value: `${fmt(per.kcal, 0)} kcal` },
          { label: "Protein / serving", value: `${fmt(per.protein, 1)} g` },
          { label: "Carbs / serving", value: `${fmt(per.carbs, 1)} g` },
          { label: "Fat / serving", value: `${fmt(per.fat, 1)} g` },
          { label: "Fiber / serving", value: `${fmt(per.fiber, 1)} g` }
        ]}
      />
    </div>
  );
}
