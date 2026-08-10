"use client";

import { useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import { Field, NumberInput, selectCls, ResultCard, ResultRow, ExampleHelper, fmt, getToolExample, exStr } from "./ui";

const SWEETENERS: Record<
  string,
  { sweetness: number; liquid?: boolean; note: string }
> = {
  honey: { sweetness: 1.25, liquid: true, note: "Reduce recipe liquid by ~3 tbsp per cup; lower oven 25°F." },
  maple: { sweetness: 1, liquid: true, note: "Near 1:1. Reduce liquid by 2–4 tbsp per cup and add a pinch of salt." },
  agave: { sweetness: 1.4, liquid: true, note: "Much sweeter — use about ⅔ the sugar amount." },
  cornSyrup: { sweetness: 0.75, liquid: true, note: "Less sweet; good for candy and glaze texture." },
  erythritol: { sweetness: 0.7, note: "Bulk and browns like sugar; add ⅓ extra for equal sweetness." },
  xylitol: { sweetness: 1, note: "1:1 for sugar. Toxic to dogs — keep out of reach." },
  stevia: { sweetness: 200, note: "Zero bulk. Use a few drops/granules; blends are easiest to bake with." },
  monkFruit: { sweetness: 200, note: "Like stevia — needs a bulking agent for baking." },
  coconutSugar: { sweetness: 0.9, note: "1:1 works; add a touch more if you want equal sweetness." }
};

export default function SweetenerConverterWidget() {
  const [sugar, setSugar] = useState("100");
  const [sweetener, setSweetener] = useState("honey");

  const loadExample = () => {
    const v = getToolExample("sweetener-converter").values;
    setSugar(exStr(v, "sugar", "100"));
    setSweetener(exStr(v, "sweetener", "honey"));
  };

  const s = parseFloat(sugar) || 0;
  const conf = SWEETENERS[sweetener];
  const equivalent = s / conf.sweetness;
  const liquidAdjust = conf.liquid ? (s / 240) * 3 : 0; // tbsp per cup of sugar

  usePublishToolFacts("sweetener-converter", {
    sugar: { label: "Sugar", value: `${fmt(s, 0)} g` },
    sweetener: {
      label: "Sweetener",
      value:
        sweetener === "cornSyrup"
          ? "corn syrup"
          : sweetener === "monkFruit"
            ? "monk fruit"
            : sweetener === "coconutSugar"
              ? "coconut sugar"
              : sweetener
    },
    equivalent: { label: "Equivalent", value: `${fmt(equivalent, 1)}` },
    unit: { label: "Unit", value: conf.liquid ? "ml" : "g" },
    liquidAdjust: { label: "Liquid to reduce", value: `${fmt(liquidAdjust, 0)} tbsp` }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <ExampleHelper
          hint="Swap 100 g of sugar for honey in a muffin recipe."
          onExample={loadExample}
        />
        <Field label="Sugar the recipe calls for (g)">
          <NumberInput value={sugar} onChange={setSugar} min={0} />
        </Field>
        <Field label="Sweetener to use instead">
          <select
            className={selectCls}
            value={sweetener}
            onChange={(e) => setSweetener(e.target.value)}
          >
            {Object.entries(SWEETENERS).map(([key, v]) => (
              <option key={key} value={key}>
                {key === "cornSyrup" ? "Corn syrup" : key === "monkFruit" ? "Monk fruit" : key === "coconutSugar" ? "Coconut sugar" : key[0].toUpperCase() + key.slice(1)}
              </option>
            ))}
          </select>
        </Field>

      </div>

      <ResultCard title="Conversion">
        <ResultRow
          label={`${fmt(s, 0)} g sugar`}
          value={`≈ ${fmt(equivalent, 1)} ${conf.liquid ? "ml" : "g"} ${sweetener === "cornSyrup" ? "corn syrup" : sweetener}`}
          strong
        />
        {conf.liquid && (
          <ResultRow
            label="Reduce other liquid"
            value={`${fmt(liquidAdjust, 0)} tbsp`}
            sub="per cup of sugar replaced"
          />
        )}
        <ResultRow label="Sweetness vs sugar" value={`${fmt(conf.sweetness, 2)}×`} />
        <p className="mt-3 rounded-lg border border-white/10 bg-white/10 p-3 text-xs leading-relaxed text-brand-100">
          {conf.note}
        </p>
      </ResultCard>
    </div>
  );
}
