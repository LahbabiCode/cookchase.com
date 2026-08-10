"use client";

import { useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import {
  Field,
  NumberInput,
  ResultRow,
  ResultCard,
  ExampleHelper,
  useNumber,
  fmt,
  getToolExample,
  exStr
} from "./ui";

const foods: { name: string; temp: number; note: string }[] = [
  { name: "Chicken (bone-in)", temp: 350, note: "Fry until internal temp hits 165°F (74°C)." },
  { name: "Chicken tenders / nuggets", temp: 350, note: "Crisp in 3-4 minutes." },
  { name: "Fish fillets", temp: 350, note: "Delicate — use a thermometer and a spider skimmer." },
  { name: "Onion rings", temp: 365, note: "Hot enough to crisp the batter fast." },
  { name: "French fries (two-stage)", temp: 325, note: "Blanch at 325°F, then finish at 375°F." },
  { name: "Potato chips", temp: 350, note: "Slice thin and fry in batches." },
  { name: "Doughnuts", temp: 365, note: "Flip once — about 60-90 seconds per side." },
  { name: "Churros", temp: 375, note: "Crisp shell, soft center." },
  { name: "Tempura batter", temp: 350, note: "Keep batter cold and fry in small batches." },
  { name: "Spring rolls / egg rolls", temp: 350, note: "Fry until golden and piping hot inside." },
  { name: "Calamari", temp: 375, note: "Quick fry — over 2 minutes gets rubbery." },
  { name: "Beignets", temp: 360, note: "Dust generously with powdered sugar." }
];

function toF(c: number): number {
  return (c * 9) / 5 + 32;
}
function toC(f: number): number {
  return ((f - 32) * 5) / 9;
}

export default function FryingTemperature() {
  const [cInput, setCInput] = useState("180");
  const c = useNumber(cInput);
  const [fInput, setFInput] = useState(String(Math.round(toF(180))));

  const loadExample = () => {
    const v = getToolExample("frying-temperature").values;
    setFInput(exStr(v, "f", "350"));
    setCInput(exStr(v, "c", "176.7"));
  };

  const onC = (v: string) => {
    setCInput(v);
    const n = useNumber(v);
    setFInput(Number.isFinite(n) && n > 0 ? String(Math.round(toF(n))) : "");
  };
  const onF = (v: string) => {
    setFInput(v);
    const n = useNumber(v);
    setCInput(Number.isFinite(n) && n > 0 ? String(Math.round(toC(n) * 10) / 10) : "");
  };

  const fryF = useNumber(fInput) || toF(180);
  const verdict =
    fryF < 330
      ? "too cool for a crisp crust"
      : fryF > 385
        ? "hot enough to burn the outside before the inside cooks"
        : "right in the frying sweet spot";

  usePublishToolFacts("frying-temperature", {
    f: { label: "Oil temperature", value: `${Math.round(fryF)}°F` },
    c: { label: "Oil temperature (C)", value: `${fmt(toC(fryF), 1)}°C` },
    verdict: { label: "Verdict", value: verdict }
  });

  return (
    <div className="space-y-5">
      <ExampleHelper
        hint="Fry chicken at 350°F — see the Celsius setting and 11 more foods."
        onExample={loadExample}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Oil temperature (°C)">
          <NumberInput value={cInput} onChange={onC} min={0} placeholder="e.g. 180" />
        </Field>
        <Field label="Oil temperature (°F)">
          <NumberInput value={fInput} onChange={onF} min={0} placeholder="e.g. 350" />
        </Field>
      </div>

      <ResultCard title="Suggested frying temperatures">
        {foods.map((f) => (
          <ResultRow
            key={f.name}
            label={f.name}
            value={`${f.temp}°F / ${fmt(toC(f.temp), 1)}°C`}
            sub={f.note}
          />
        ))}
      </ResultCard>

      <p className="text-xs leading-relaxed text-ink-500">
        The single most important rule of deep frying: watch the thermometer, not the clock. Oil
        that is too cool soaks into the food; oil that is too hot burns the outside before the
        inside cooks. Fry in small batches so the oil never drops more than about 15°F (8°C).
      </p>
    </div>
  );
}
