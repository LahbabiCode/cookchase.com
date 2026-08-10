"use client";

import { useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import { Field, NumberInput, selectCls, ResultCard, ResultRow, ExampleHelper, fmt, getToolExample, exStr, exNum } from "./ui";

const GUIDES: Record<string, { label: string; hours: string; note: string }> = {
  chicken: { label: "Whole chicken (~1.5 kg)", hours: "8–12 hours", note: "Rinse not needed; pat dry for crispy skin." },
  turkey: { label: "Turkey (5–7 kg)", hours: "18–24 hours", note: "Loosely tent foil if browning too fast." },
  chops: { label: "Pork chops / chicken breast", hours: "30–60 minutes", note: "Quick brine — don't oversleep it!" },
  shrimp: { label: "Shrimp", hours: "15–30 minutes", note: "Brine gently; shrimp absorb salt fast." }
};

export default function BrineCalculatorWidget() {
  const [weight, setWeight] = useState("1.5");
  const [mode, setMode] = useState<"wet" | "dry">("wet");
  const [saltPct, setSaltPct] = useState(5);
  const [guide, setGuide] = useState("chicken");

  const loadExample = () => {
    const v = getToolExample("brine-calculator").values;
    setWeight(exStr(v, "weight", "1.5"));
    setMode(exStr(v, "mode", "wet") as "wet" | "dry");
    setSaltPct(exNum(v, "saltPct", 5));
    setGuide(exStr(v, "guide", "chicken"));
  };

  const w = parseFloat(weight) || 0;
  const water = w * 2; // liters to cover
  const salt = mode === "wet" ? (water * saltPct * 1000) / 100 : w * 1000 * 0.015; // dry ~1.5%
  const sugar = mode === "wet" ? salt * 0.75 : salt * 0.5;

  const g = GUIDES[guide];

  usePublishToolFacts("brine-calculator", {
    weight: { label: "Meat weight", value: `${fmt(w, 1)} kg` },
    mode: { label: "Brine type", value: mode === "wet" ? "wet" : "dry" },
    salt: { label: "Salt", value: `${fmt(salt, 0)} g` },
    water: { label: "Water", value: mode === "wet" ? `${fmt(water, 1)} liters` : "" },
    time: { label: "Brine time", value: g.hours },
    guide: { label: "What you're brining", value: g.label.toLowerCase() }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <ExampleHelper
          hint="Brine a 1.5 kg whole chicken overnight in a classic 5% wet brine."
          onExample={loadExample}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Meat weight (kg)">
            <NumberInput value={weight} onChange={setWeight} min={0.1} />
          </Field>
          <Field label="What are you brining?">
            <select className={selectCls} value={guide} onChange={(e) => setGuide(e.target.value)}>
              {Object.entries(GUIDES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-md border border-ink-200 p-1">
          {(["wet", "dry"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded px-4 py-2 text-sm font-medium transition ${
                mode === m ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-50"
              }`}
            >
              {m === "wet" ? "Wet brine" : "Dry brine"}
            </button>
          ))}
        </div>

        {mode === "wet" && (
          <Field label="Salt percentage" hint="5% is the classic all-purpose brine">
            <select
              className={selectCls}
              value={saltPct}
              onChange={(e) => setSaltPct(Number(e.target.value))}
            >
              <option value={4}>4% (mild)</option>
              <option value={5}>5% (classic)</option>
              <option value={6}>6% (bold)</option>
              <option value={8}>8% (cure-strength, short use only)</option>
            </select>
          </Field>
        )}

        <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">
          {g.note} Suggested brine time: <strong className="text-ink-700">{g.hours}</strong>
        </p>

      </div>

      <ResultCard title="Your brine recipe">
        {mode === "wet" ? (
          <>
            <ResultRow label="Water" value={`${fmt(water, 1)} liters`} strong />
            <ResultRow label="Salt" value={`${fmt(salt, 0)} g`} strong />
            <ResultRow label="Sugar (optional)" value={`${fmt(sugar, 0)} g`} />
          </>
        ) : (
          <>
            <ResultRow label="Salt" value={`${fmt(salt, 0)} g`} strong />
            <ResultRow label="Sugar (optional)" value={`${fmt(sugar, 0)} g`} />
            <ResultRow label="Method" value="Rub, rest overnight" sub="no water needed" />
          </>
        )}
        <ResultRow label="Brine time" value={g.hours} />
        <p className="mt-3 rounded-lg border border-white/10 bg-white/10 p-3 text-xs leading-relaxed text-brand-100">
          <strong className="text-white">After brining:</strong> pat completely dry and
          skip extra salt in your recipe — the meat is already seasoned through.
        </p>
      </ResultCard>
    </div>
  );
}
