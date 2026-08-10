"use client";

import { useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import { Field, NumberInput, SliderInput, ResultCard, ResultRow, ExampleHelper, fmt, getToolExample, exStr, exNum } from "./ui";

export default function SourdoughCalculatorWidget() {
  const [current, setCurrent] = useState("50");
  const [target, setTarget] = useState("200");
  const [ratio, setRatio] = useState(2);

  const loadExample = () => {
    const v = getToolExample("sourdough-calculator").values;
    setCurrent(exStr(v, "current", "80"));
    setTarget(exStr(v, "target", "300"));
    setRatio(exNum(v, "ratio", 2));
  };

  const c = parseFloat(current) || 0;
  const t = parseFloat(target) || 0;
  const flour = c * ratio;
  const water = c * ratio; // 100% hydration
  const total = c + flour + water;
  const discard = total > t ? total - t : 0;
  const useStarter = t - c;

  const ratioLabel =
    ratio === 1 ? "1:1:1 (daily, mild)" : ratio === 2 ? "1:2:2 (standard, strong)" : ratio === 5 ? "1:5:5 (weekly, fridge)" : `${ratio}`;

  usePublishToolFacts("sourdough-calculator", {
    current: { label: "Starter you have", value: `${fmt(c, 0)} g` },
    target: { label: "Target amount", value: `${fmt(t, 0)} g` },
    ratio: { label: "Feeding ratio", value: String(ratio) },
    flour: { label: "Add flour", value: `${fmt(flour, 0)} g` },
    water: { label: "Add water", value: `${fmt(water, 0)} ml` },
    discard: { label: "Discard", value: `${fmt(discard, 0)} g` }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <ExampleHelper
          hint="Feed 80 g of starter up to 300 g at a standard 1:2:2 ratio."
          onExample={loadExample}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Starter you have (g)">
            <NumberInput value={current} onChange={setCurrent} min={5} />
          </Field>
          <Field label="Target amount (g)">
            <NumberInput value={target} onChange={setTarget} min={10} />
          </Field>
        </div>
        <Field label="Feeding ratio" hint={ratioLabel}>
          <SliderInput
            value={ratio}
            onChange={setRatio}
            min={1}
            max={5}
            step={1}
            display={(v) => `1:${v}:${v}`}
          />
        </Field>
        <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">
          <strong className="text-ink-700">1:1:1</strong> daily maintenance ·{" "}
          <strong className="text-ink-700">1:2:2</strong> standard feed ·{" "}
          <strong className="text-ink-700">1:5:5</strong> weekly fridge feed. This tool
          assumes a 100% hydration starter (equal flour & water by weight).
        </p>

      </div>

      <ResultCard title="Feeding plan">
        <ResultRow label="Discard" value={`${fmt(discard, 0)} g`} sub={discard > 0 ? "save for pancakes!" : "none needed"} />
        <ResultRow label="Add flour" value={`${fmt(flour, 0)} g`} strong />
        <ResultRow label="Add water" value={`${fmt(water, 0)} ml`} strong />
        <ResultRow label="Fresh starter total" value={`${fmt(total, 0)} g`} />
        {discard > 0 && (
          <ResultRow label="Use for your bake" value={`${fmt(useStarter, 0)} g`} sub="that's your levain" />
        )}
      </ResultCard>
    </div>
  );
}
