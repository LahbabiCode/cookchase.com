"use client";

import { useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import {
  Field,
  NumberInput,
  ResultRow,
  ResultCard,
  CopyButton,
  ResetButton,
  ExampleHelper,
  useNumber,
  fmt,
  getToolExample,
  exStr
} from "./ui";

export default function DoughBatchConverter() {
  const [target, setTarget] = useState("1000");
  const [hydration, setHydration] = useState("70");
  const [saltPct, setSaltPct] = useState("2");
  const [flourSplit, setFlourSplit] = useState("100");

  const loadExample = () => {
    const v = getToolExample("dough-batch-converter").values;
    setTarget(exStr(v, "target", "1200"));
    setHydration(exStr(v, "hydration", "72"));
    setSaltPct(exStr(v, "saltPct", "2.1"));
    setFlourSplit(exStr(v, "flourSplit", "20"));
  };

  const targetG = useNumber(target);
  const h = useNumber(hydration);
  const s = useNumber(saltPct);
  const split = Math.min(100, Math.max(0, useNumber(flourSplit)));

  const totalPct = 100 + h + s;
  const flour = totalPct > 0 ? (targetG * 100) / totalPct : 0;
  const water = (flour * h) / 100;
  const salt = (flour * s) / 100;
  const white = (flour * split) / 100;
  const whole = flour - white;

  const parts: { label: string; value: string; sub: string }[] = [
    { label: "Total flour", value: `${fmt(flour)} g`, sub: "100%" },
    {
      label: "Water",
      value: `${fmt(water)} g`,
      sub: `${h}% hydration — ${fmt(water / 1000)} L`
    },
    { label: "Salt", value: `${fmt(salt)} g`, sub: `${s}%` },
    { label: "Total dough", value: `${fmt(flour + water + salt)} g`, sub: "your target" }
  ];

  if (split > 0 && split < 100) {
    parts.splice(1, 0, {
      label: `Bread flour (${fmt(split)}%)`,
      value: `${fmt(white)} g`,
      sub: "sifted into mix"
    });
    parts.splice(1, 0, {
      label: `Whole wheat (${fmt(100 - split)}%)`,
      value: `${fmt(whole)} g`,
      sub: "blend ratio"
    });
  }

  const reset = () => {
    setTarget("1000");
    setHydration("70");
    setSaltPct("2");
    setFlourSplit("100");
  };

  usePublishToolFacts("dough-batch-converter", {
    target: { label: "Target dough", value: `${fmt(flour + water + salt, 0)} g` },
    hydration: { label: "Hydration", value: `${h}%` },
    flour: { label: "Total flour", value: `${fmt(flour, 0)} g` },
    water: { label: "Water", value: `${fmt(water, 0)} g` },
    salt: { label: "Salt", value: `${fmt(salt, 1)} g` }
  });

  return (
    <div className="space-y-5">
      <ExampleHelper
        hint="Scale a dough formula up to a 1.2 kg batch at 72% hydration."
        onExample={loadExample}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Target dough weight (g)" hint="How much dough you want to end up with.">
          <NumberInput value={target} onChange={setTarget} min={0} placeholder="e.g. 1000" />
        </Field>
        <Field label="Hydration" hint="Water as a % of flour weight. 65-70% is classic bread.">
          <NumberInput value={hydration} onChange={setHydration} min={0} placeholder="e.g. 70" />
        </Field>
        <Field label="Salt (baker's %)" hint="Usually 1.8-2.2% for bread.">
          <NumberInput value={saltPct} onChange={setSaltPct} min={0} step="0.1" placeholder="e.g. 2" />
        </Field>
        <Field label="Whole wheat share (%)" hint="0 = all white flour, 100 = all whole wheat.">
          <NumberInput value={flourSplit} onChange={setFlourSplit} min={0} step="5" placeholder="e.g. 20" />
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        <CopyButton
          text={`Dough formula for ${fmt(flour + water + salt)} g:\n- Bread flour: ${fmt(white)} g\n- Whole wheat: ${fmt(whole)} g\n- Water: ${fmt(water)} g (${h}% hydration)\n- Salt: ${fmt(salt)} g`}
        />
        <ResetButton onReset={reset} />
      </div>

      <ResultCard title="Your dough formula">
        {parts.map((p) => (
          <ResultRow key={p.label} label={p.label} value={p.value} sub={p.sub} strong={p.label === "Total dough"} />
        ))}
      </ResultCard>

      <p className="text-xs leading-relaxed text-ink-500">
        Baker's math keeps every percentage relative to the total flour weight, so you can scale
        any formula up or down and it will always behave the same way.
      </p>
    </div>
  );
}
