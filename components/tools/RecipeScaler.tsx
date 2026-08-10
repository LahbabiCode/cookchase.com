"use client";

import { useState } from "react";
import {
  Field,
  NumberInput,
  inputCls,
  selectCls,
  ResultCard,
  ResultRow,
  AddRowButton,
  RemoveButton,
  ResetButton,
  CopyButton,
  ExampleHelper,
  useNumber,
  fmt,
  fraction,
  getToolExample,
  exStr,
  exArr
} from "./ui";
import ProToolActions from "./ProToolActions";
import { usePublishToolFacts } from "./faqStore";

interface Ing {
  name: string;
  amount: string;
  unit: string;
}

const units = ["cup(s)", "tbsp", "tsp", "g", "kg", "oz", "lb", "ml", "l", "pinch"];

export default function RecipeScalerWidget() {
  const [original, setOriginal] = useState("4");
  const [desired, setDesired] = useState("8");
  const [rows, setRows] = useState<Ing[]>([
    { name: "Flour", amount: "250", unit: "g" },
    { name: "Sugar", amount: "1", unit: "cup(s)" },
    { name: "Butter", amount: "100", unit: "g" },
    { name: "Eggs", amount: "2", unit: "piece" }
  ]);

  const loadExample = () => {
    const v = getToolExample("recipe-scaler").values;
    setOriginal(exStr(v, "original", "6"));
    setDesired(exStr(v, "desired", "12"));
    setRows(
      exArr<Ing>(v, "rows", [
        { name: "Flour", amount: "300", unit: "g" },
        { name: "Sugar", amount: "200", unit: "g" },
        { name: "Butter", amount: "150", unit: "g" },
        { name: "Eggs", amount: "3", unit: "piece" },
        { name: "Milk", amount: "240", unit: "ml" },
        { name: "Baking powder", amount: "2", unit: "tsp" }
      ])
    );
  };

  const orig = useNumber(original);
  const want = useNumber(desired);
  const factor = orig > 0 ? want / orig : 0;

  const update = (i: number, patch: Partial<Ing>) => {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  };

  const scaled = rows.map((r) => ({
    ...r,
    scaledAmount: useNumber(r.amount) * factor
  }));

  const copyText = scaled
    .map((r) => `${r.name}: ${fraction(r.scaledAmount)} ${r.unit}`)
    .join("\n");

  // Snapshot of the current calculation for Pro save/export.
  const resultRows = [
    { label: "Scale factor", value: `${fmt(factor, 2)}×` },
    ...scaled.map((r) => ({
      label: r.name || "Ingredient",
      value: `${fraction(r.scaledAmount)} ${r.unit}`,
      sub: r.amount ? `was ${r.amount} ${r.unit}` : undefined
    }))
  ];

  usePublishToolFacts("recipe-scaler", {
    servingsFrom: { label: "Original servings", value: fmt(orig, 0) },
    servingsTo: { label: "Desired servings", value: fmt(want, 0) },
    factor: { label: "Scale factor", value: `${fmt(factor, 2)}×` },
    ing1Name: {
      label: "First ingredient",
      value: scaled[0]?.name || "your first ingredient"
    },
    ing1Scaled: {
      label: "Scaled amount",
      value: scaled[0] ? fraction(scaled[0].scaledAmount) : ""
    },
    ing1Unit: { label: "Unit", value: scaled[0]?.unit || "" },
    ing1Orig: { label: "Original amount", value: scaled[0]?.amount || "" }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <ExampleHelper
          hint="Scale a birthday cake — change servings from 6 to 12 and every ingredient updates."
          onExample={loadExample}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Original servings">
            <NumberInput value={original} onChange={setOriginal} min={1} />
          </Field>
          <Field label="Desired servings">
            <NumberInput value={desired} onChange={setDesired} min={1} />
          </Field>
        </div>

        <div className="rounded-lg border border-ink-200">
          {rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_90px_110px_auto] items-center gap-2 border-b border-ink-100 p-2 last:border-0"
            >
              <input
                className={inputCls}
                value={row.name}
                placeholder="Ingredient"
                onChange={(e) => update(i, { name: e.target.value })}
              />
              <NumberInput
                value={row.amount}
                onChange={(v) => update(i, { amount: v })}
              />
              <select
                className={selectCls}
                value={row.unit}
                onChange={(e) => update(i, { unit: e.target.value })}
              >
                {units.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
              <RemoveButton onRemove={() => setRows((r) => r.filter((_, idx) => idx !== i))} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <AddRowButton onClick={() => setRows((r) => [...r, { name: "", amount: "1", unit: "cup(s)" }])}>
            Add ingredient
          </AddRowButton>
          <ResetButton
            onReset={() => {
              setOriginal("4");
              setDesired("8");
              setRows([
                { name: "Flour", amount: "250", unit: "g" },
                { name: "Sugar", amount: "1", unit: "cup(s)" },
                { name: "Butter", amount: "100", unit: "g" },
                { name: "Eggs", amount: "2", unit: "piece" }
              ]);
            }}
          />
        </div>
      </div>

      <ResultCard
        title={`Scale factor: ${fmt(factor, 2)}×`}
        note={
          factor > 0
            ? `${fmt(orig)} servings → ${fmt(want)} servings. For baking, consider reducing leavening, salt & spices to ~75%; when in doubt, weigh ingredients for the most accurate result.`
            : "Enter valid serving numbers to begin."
        }
      >
        <div className="max-h-72 overflow-y-auto pr-1">
          {scaled.map((r, i) => (
            <ResultRow
              key={i}
              label={r.name || `Ingredient ${i + 1}`}
              value={`${fraction(r.scaledAmount)} ${r.unit}`}
              sub={r.amount ? `was ${r.amount} ${r.unit}` : undefined}
              strong
            />
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <CopyButton text={copyText} />
        </div>
      </ResultCard>
      <ProToolActions toolSlug="recipe-scaler" toolName="Recipe Scaler" rows={resultRows} />
    </div>
  );
}
