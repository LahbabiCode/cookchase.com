"use client";

import { useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import { Field, NumberInput, selectCls, ResultCard, ResultRow, ExampleHelper, fmt, getToolExample, exStr } from "./ui";

const METHODS: Record<string, { label: string; retention: number }> = {
  raw: { label: "Added raw (no cooking)", retention: 1 },
  flambe: { label: "Flambé (quick flame)", retention: 0.25 },
  bake15: { label: "Baked 15 min", retention: 0.45 },
  simmer15: { label: "Simmered 15 min", retention: 0.4 },
  simmer30: { label: "Simmered 30 min", retention: 0.35 },
  simmer60: { label: "Simmered 60 min", retention: 0.25 },
  simmer150: { label: "Simmered 2.5 hours", retention: 0.05 }
};

const ALCOHOL: Record<string, { label: string; abv: number }> = {
  wine: { label: "Wine (12%)", abv: 0.12 },
  beer: { label: "Beer (5%)", abv: 0.05 },
  sake: { label: "Sake (15%)", abv: 0.15 },
  vermouth: { label: "Vermouth (18%)", abv: 0.18 },
  brandy: { label: "Brandy / cognac (40%)", abv: 0.4 },
  rum: { label: "Rum (40%)", abv: 0.4 }
};

export default function AlcoholCookoffWidget() {
  const [volume, setVolume] = useState("100");
  const [alcohol, setAlcohol] = useState("wine");
  const [method, setMethod] = useState("simmer30");

  const loadExample = () => {
    const v = getToolExample("alcohol-cookoff").values;
    setVolume(exStr(v, "volume", "250"));
    setAlcohol(exStr(v, "alcohol", "wine"));
    setMethod(exStr(v, "method", "simmer30"));
  };

  const v = parseFloat(volume) || 0;
  const conf = ALCOHOL[alcohol];
  const m = METHODS[method];
  const alcoholMl = v * conf.abv;
  const remainingMl = alcoholMl * m.retention;
  const remainingG = remainingMl * 0.789; // ethanol density
  const shots = remainingG / 14; // ~14g ethanol per shot

  usePublishToolFacts("alcohol-cookoff", {
    volume: { label: "Alcohol amount", value: `${fmt(v, 0)} ml` },
    alcohol: { label: "Type", value: conf.label },
    method: { label: "Cooking method", value: m.label },
    remaining: { label: "Alcohol remaining", value: `${fmt(remainingMl, 2)} ml` },
    retention: { label: "Retention", value: `${fmt(m.retention * 100, 0)}%` }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <ExampleHelper
          hint="See how much alcohol remains after simmering 250 ml of wine for 30 minutes."
          onExample={loadExample}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Alcohol amount (ml)">
            <NumberInput value={volume} onChange={setVolume} min={0} />
          </Field>
          <Field label="Type of alcohol">
            <select className={selectCls} value={alcohol} onChange={(e) => setAlcohol(e.target.value)}>
              {Object.entries(ALCOHOL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Cooking method">
          <select className={selectCls} value={method} onChange={(e) => setMethod(e.target.value)}>
            {Object.entries(METHODS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
        <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">
          Based on USDA retention-factor data. A covered pan retains dramatically more
          alcohol than an open simmer — keep the lid off to reduce alcohol.
        </p>

      </div>

      <ResultCard title="Alcohol remaining">
        <ResultRow label="Alcohol in recipe" value={`${fmt(alcoholMl, 1)} ml ethanol`} />
        <ResultRow label="Remaining after cooking" value={`${fmt(remainingMl, 2)} ml`} strong />
        <ResultRow label="Retention" value={`${fmt(m.retention * 100, 0)}%`} />
        <ResultRow label="Equivalent shots" value={`${fmt(shots, 2)}`} sub="14 g ethanol per shot" />
        <p className="mt-3 rounded-lg border border-white/10 bg-white/10 p-3 text-xs leading-relaxed text-brand-100">
          <strong className="text-white">For kids or alcohol-free guests:</strong> only a
          ~4-hour simmer gets truly negligible. Swap wine for stock + vinegar instead.
        </p>
      </ResultCard>
    </div>
  );
}
