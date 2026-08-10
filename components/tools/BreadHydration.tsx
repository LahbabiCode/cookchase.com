"use client";

import { useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import { Field, NumberInput, SliderInput, ResultCard, ResultRow, ExampleHelper, fmt, getToolExample, exStr, exNum } from "./ui";

export default function BreadHydrationWidget() {
  const [flour, setFlour] = useState("500");
  const [hydration, setHydration] = useState(70);
  const [saltPct, setSaltPct] = useState(2);
  const [yeastPct, setYeastPct] = useState(1);

  const loadExample = () => {
    const v = getToolExample("bread-hydration").values;
    setFlour(exStr(v, "flour", "500"));
    setHydration(exNum(v, "hydration", 70));
    setSaltPct(exNum(v, "saltPct", 2));
    setYeastPct(exNum(v, "yeastPct", 1));
  };

  const f = parseFloat(flour) || 0;
  const water = (f * hydration) / 100;
  const salt = (f * saltPct) / 100;
  const yeast = (f * yeastPct) / 100;
  const total = f + water + salt + yeast;

  const feel =
    hydration < 58
      ? "Very stiff — bagel/baguerre territory, hand-knead easily."
      : hydration < 63
        ? "Firm dough — easy to knead, great for beginners."
        : hydration < 70
          ? "Soft, slightly tacky — the classic artisan range."
          : hydration < 76
            ? "Wet and slack — manage with stretch & folds."
            : "Very wet — needs careful handling, advanced technique.";

  usePublishToolFacts("bread-hydration", {
    flour: { label: "Flour", value: `${fmt(f, 0)} g` },
    hydration: { label: "Hydration", value: `${hydration}%` },
    water: { label: "Water", value: `${fmt(water, 0)} ml` },
    salt: { label: "Salt", value: `${fmt(salt, 1)} g` },
    total: { label: "Total dough", value: `${fmt(total, 0)} g` },
    feel: { label: "Dough feel", value: feel }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <ExampleHelper
          hint="Build a 70% hydration loaf from 500 g of flour — water, salt and yeast."
          onExample={loadExample}
        />
        <Field label="Flour (g)">
          <NumberInput value={flour} onChange={setFlour} min={50} />
        </Field>
        <Field label="Hydration">
          <SliderInput
            value={hydration}
            onChange={setHydration}
            min={50}
            max={85}
            step={1}
            display={(v) => `${v}%`}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Salt %">
            <SliderInput
              value={saltPct}
              onChange={setSaltPct}
              min={0}
              max={3}
              step={0.1}
              display={(v) => `${v.toFixed(1)}%`}
            />
          </Field>
          <Field label="Yeast % (instant)">
            <SliderInput
              value={yeastPct}
              onChange={setYeastPct}
              min={0}
              max={2.5}
              step={0.1}
              display={(v) => `${v.toFixed(1)}%`}
            />
          </Field>
        </div>
        <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">{feel}</p>

      </div>

      <ResultCard title="Dough formula" note="Baker's percentages — every ingredient is a % of the flour weight.">
        <ResultRow label="Flour" value={`${fmt(f, 0)} g`} strong />
        <ResultRow label="Water" value={`${fmt(water, 0)} ml`} strong />
        <ResultRow label="Salt" value={`${fmt(salt, 1)} g`} />
        <ResultRow label="Instant yeast" value={`${fmt(yeast, 2)} g`} />
        <ResultRow label="Total dough weight" value={`${fmt(total, 0)} g`} />
        <p className="mt-3 rounded-lg border border-white/10 bg-white/10 p-3 text-xs leading-relaxed text-brand-100">
          <strong className="text-white">Pro tip:</strong> autolyse flour + water for 30
          minutes before adding salt and yeast for better gluten and flavor.
        </p>
      </ResultCard>
    </div>
  );
}
