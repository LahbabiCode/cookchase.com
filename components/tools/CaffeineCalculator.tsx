"use client";

import { useState } from "react";
import { usePublishToolFacts } from "./faqStore";
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
  exArr
} from "./ui";

const DRINKS: Record<string, { label: string; mgPer100ml: number }> = {
  drip: { label: "Drip coffee", mgPer100ml: 40 },
  espresso: { label: "Espresso", mgPer100ml: 210 },
  coldBrew: { label: "Cold brew", mgPer100ml: 67 },
  instant: { label: "Instant coffee", mgPer100ml: 28 },
  blackTea: { label: "Black tea", mgPer100ml: 20 },
  greenTea: { label: "Green tea", mgPer100ml: 12 },
  energy: { label: "Energy drink", mgPer100ml: 12 },
  cola: { label: "Cola", mgPer100ml: 9.6 }
};

interface Row {
  type: string;
  ml: string;
}

export default function CaffeineCalculatorWidget() {
  const [rows, setRows] = useState<Row[]>([
    { type: "drip", ml: "240" },
    { type: "espresso", ml: "60" }
  ]);

  const loadExample = () => {
    const v = getToolExample("caffeine-calculator").values;
    setRows(
      exArr<Row>(v, "rows", [
        { type: "drip", ml: "240" },
        { type: "espresso", ml: "60" },
        { type: "blackTea", ml: "300" },
        { type: "cola", ml: "330" }
      ])
    );
  };

  const update = (i: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const items = rows.map((r) => ({
    ...r,
    info: DRINKS[r.type],
    mg: useNumber(r.ml) * DRINKS[r.type].mgPer100ml / 100
  }));

  const total = items.reduce((s, r) => s + r.mg, 0);
  const pct = (total / 400) * 100;

  usePublishToolFacts("caffeine-calculator", {
    drinks: { label: "Drinks logged", value: String(rows.length) },
    total: { label: "Total caffeine", value: `${fmt(total, 0)} mg` },
    status: {
      label: "Status",
      value:
        total === 0
          ? "—"
          : total <= 200
            ? "comfortable"
            : total <= 400
              ? "within the FDA guideline"
              : "above the FDA guideline"
    }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <ExampleHelper
          hint="Track a coffee-heavy workday — drip, espresso, tea and cola."
          onExample={loadExample}
        />
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_120px_auto] items-center gap-2">
            <select
              className={selectCls}
              value={row.type}
              onChange={(e) => update(i, { type: e.target.value })}
            >
              {Object.entries(DRINKS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <div className="relative">
              <NumberInput value={row.ml} onChange={(v) => update(i, { ml: v })} />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-400">
                ml
              </span>
            </div>
            <RemoveButton onRemove={() => setRows((r) => r.filter((_, idx) => idx !== i))} />
          </div>
        ))}
        <div className="flex items-center gap-2">
          <AddRowButton onClick={() => setRows((r) => [...r, { type: "drip", ml: "240" }])}>
            Add drink
          </AddRowButton>
          <ResetButton onReset={() => setRows([])} />
        </div>
      </div>

      <ResultCard title="Daily caffeine">
        <ResultRow label="Total caffeine" value={`${fmt(total, 0)} mg`} strong />
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${pct > 100 ? "bg-red-400" : "bg-copper-400"}`}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] text-brand-200/70">vs. 400 mg FDA guideline</p>
        <ResultRow
          label="Status"
          value={
            total === 0
              ? "—"
              : total <= 200
                ? "Comfortable"
                : total <= 400
                  ? "Within guideline"
                  : "Above guideline"
          }
        />
        <p className="mt-3 rounded-lg border border-white/10 bg-white/10 p-3 text-xs leading-relaxed text-brand-100">
          <strong className="text-white">Reminder:</strong> values are typical estimates
          and vary by brand, brew strength and bean.
        </p>
      </ResultCard>
    </div>
  );
}
