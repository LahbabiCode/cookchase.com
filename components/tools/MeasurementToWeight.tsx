"use client";

import { useMemo, useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import {
  NumberInput,
  selectCls,
  ResultCard,
  ResultRow,
  CopyButton,
  ResetButton,
  AddRowButton,
  RemoveButton,
  ExampleHelper,
  useNumber,
  fmt,
  getToolExample,
  exArr
} from "./ui";
import { useIngredientDensities } from "./useIngredientDensities";
import { CUP_TO_TBSP, CUP_TO_TSP } from "./densities";
import { Scale, Info, Repeat } from "lucide-react";

type Unit = "cup" | "tbsp" | "tsp";

interface Row {
  ingredient: string;
  amount: string;
  unit: Unit;
}

const initialRows = (): Row[] => [
  { ingredient: "All-purpose flour", amount: "2", unit: "cup" },
  { ingredient: "Granulated sugar", amount: "0.5", unit: "cup" },
  { ingredient: "Butter (melted)", amount: "8", unit: "tbsp" }
];

const cupFactor = (unit: Unit): number =>
  unit === "cup" ? 1 : unit === "tbsp" ? CUP_TO_TBSP : CUP_TO_TSP;

export default function MeasurementToWeightWidget() {
  const { densities, densityMap } = useIngredientDensities();
  const [rows, setRows] = useState<Row[]>(initialRows);

  const update = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));
  const add = () =>
    setRows((rs) => [...rs, { ingredient: "All-purpose flour", amount: "1", unit: "cup" }]);

  const loadExample = () => {
    const v = getToolExample("measurement-to-weight").values;
    setRows(
      exArr<Row>(v, "rows", [
        { ingredient: "All-purpose flour", amount: "2", unit: "cup" },
        { ingredient: "Granulated sugar", amount: "0.5", unit: "cup" },
        { ingredient: "Butter (melted)", amount: "8", unit: "tbsp" },
        { ingredient: "Milk (whole)", amount: "1", unit: "cup" },
        { ingredient: "Honey", amount: "3", unit: "tbsp" }
      ])
    );
  };

  const calc = useMemo(() => {
    const gramsByIngredient: Record<string, number> = {};
    let total = 0;
    const detailed = rows.map((r) => {
      const gPerCup = densityMap[r.ingredient] ?? 125;
      const amount = useNumber(r.amount);
      const grams = amount * (gPerCup / cupFactor(r.unit));
      total += grams;
      gramsByIngredient[r.ingredient] =
        (gramsByIngredient[r.ingredient] || 0) + grams;
      return { ...r, grams, gPerCup };
    });
    return { detailed, total, gramsByIngredient };
  }, [rows, densityMap]);

  const topIngredient =
    Object.entries(calc.gramsByIngredient).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "your first ingredient";

  usePublishToolFacts("measurement-to-weight", {
    count: { label: "Ingredients", value: String(rows.length) },
    total: { label: "Total weight", value: `${fmt(calc.total, 1)} g` },
    totalKg: { label: "Total weight (kg)", value: `${fmt(calc.total / 1000, 2)} kg` },
    top: { label: "Heaviest ingredient", value: topIngredient }
  });

  return (
    <div className="space-y-6">
      <ExampleHelper
        hint="Rewrite a cup-based baking recipe in grams — flour, sugar, butter and more."
        onExample={loadExample}
      />
      <div className="overflow-hidden rounded-xl border border-ink-200">
        <div className="grid grid-cols-[1fr_80px_90px_auto] items-center gap-1.5 bg-ink-900 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white sm:grid-cols-[1fr_80px_90px_auto]">
          <span>Ingredient</span>
          <span>Amount</span>
          <span>Unit</span>
          <span />
        </div>
        <div className="divide-y divide-ink-100 bg-white">
          {calc.detailed.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_80px_90px_auto] items-center gap-1.5 p-2 sm:grid-cols-[1fr_80px_90px_auto]"
            >
              <select
                className={`${selectCls} px-2 py-1.5 text-xs`}
                value={r.ingredient}
                onChange={(e) => update(i, { ingredient: e.target.value })}
              >
                {densities.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              <NumberInput
                value={r.amount}
                onChange={(v) => update(i, { amount: v })}
                min={0}
                placeholder="1"
              />
              <select
                className={`${selectCls} px-2 py-1.5 text-xs`}
                value={r.unit}
                onChange={(e) => update(i, { unit: e.target.value as Unit })}
              >
                <option value="cup">cups</option>
                <option value="tbsp">tbsp</option>
                <option value="tsp">tsp</option>
              </select>
              <RemoveButton onRemove={() => remove(i)} />
            </div>
          ))}
        </div>
        <div className="bg-ink-50 p-2">
          <AddRowButton onClick={add}>Add ingredient</AddRowButton>
        </div>
      </div>

      <ResultCard title="Converted recipe (by weight)" note="Weights use USDA-style grams per cup — the reliable way to bake.">
        <div className="divide-y divide-white/10">
          {calc.detailed.map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-2">
              <span className="text-sm text-brand-100">
                {fmt(useNumber(r.amount), 2)} {r.unit === "cup" ? "cup" : r.unit === "tbsp" ? "tbsp" : "tsp"}{" "}
                {r.ingredient.toLowerCase()}
              </span>
              <span className="readout text-sm font-bold text-copper-200">{fmt(r.grams, 1)} g</span>
            </div>
          ))}
        </div>
        <ResultRow
          label="Total weight"
          value={`${fmt(calc.total, 1)} g`}
          sub={`${fmt(calc.total / 1000, 2)} kg`}
          strong
        />
      </ResultCard>

      {/* Totals by ingredient (duplicates merged) */}
      {Object.keys(calc.gramsByIngredient).length > 0 && (
        <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
          <div className="flex items-center gap-2 border-b border-ink-200 bg-ink-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
            <Repeat className="h-3.5 w-3.5 text-brand-600" />
            Combined totals by ingredient
          </div>
          <div className="divide-y divide-ink-100">
            {Object.entries(calc.gramsByIngredient).map(([name, g]) => (
              <div key={name} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="text-ink-700">{name}</span>
                <span className="font-semibold text-ink-900">{fmt(g, 1)} g</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-ink-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <span>
          <strong className="text-ink-700">Why convert to weight?</strong> Flour settles in its bag, so
          "1 cup" can be 110 g or 140 g depending on how you scoop. Weighing gives the same result
          every time — this converter removes the guesswork from any recipe written in cups.
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <CopyButton
          text={calc.detailed
            .map((r) => `${fmt(r.grams, 1)} g ${r.ingredient.toLowerCase()}`)
            .join("\n")}
        />
        <ResetButton onReset={() => setRows(initialRows())} />
      </div>

      <p className="flex items-center gap-1.5 text-xs text-ink-400">
        <Scale className="h-3.5 w-3.5" />
        All conversions based on the same density table used by the Grams ↔ Cups converter.
      </p>
    </div>
  );
}
