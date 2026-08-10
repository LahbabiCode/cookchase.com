"use client";

import { useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import { Field, selectCls, ResultCard, ResultRow, ExampleHelper, fmt, getToolExample, exStr, exNum } from "./ui";

interface Entry {
  label: string;
  options: { label: string; tempC: number; timeMin: number; note: string }[];
}

const DATA: Record<string, Entry> = {
  steak: {
    label: "Steak (thick cut)",
    options: [
      { label: "Rare", tempC: 52, timeMin: 60, note: "Rosy center, very tender" },
      { label: "Medium rare", tempC: 55, timeMin: 60, note: "The classic steakhouse result" },
      { label: "Medium", tempC: 58, timeMin: 60, note: "Pink throughout, more chew" },
      { label: "Well done", tempC: 65, timeMin: 90, note: "Uniform brown, drier" }
    ]
  },
  chickenBreast: {
    label: "Chicken breast",
    options: [
      { label: "Juicy & safe", tempC: 64, timeMin: 90, note: "Pasteurized, tender, never dry" },
      { label: "Classic", tempC: 66, timeMin: 90, note: "Firmer, still juicy" }
    ]
  },
  chickenThigh: {
    label: "Chicken thighs",
    options: [
      { label: "Tender", tempC: 74, timeMin: 120, note: "Fall-apart, safe for shredding" }
    ]
  },
  porkChop: {
    label: "Pork chop",
    options: [
      { label: "Medium", tempC: 60, timeMin: 60, note: "Juicy, blush center — fully safe" },
      { label: "Well done", tempC: 66, timeMin: 60, note: "Firmer texture" }
    ]
  },
  salmon: {
    label: "Salmon fillet",
    options: [
      { label: "Silky medium", tempC: 48, timeMin: 40, note: "Translucent center, silky texture" },
      { label: "Cooked through", tempC: 52, timeMin: 40, note: "Opaque, flakes easily" }
    ]
  },
  egg: {
    label: "Eggs (in shell)",
    options: [
      { label: "Jammy yolk", tempC: 63, timeMin: 45, note: "Soft set yolk, custard-like white" },
      { label: "Soft boiled", tempC: 70, timeMin: 20, note: "Runny center, firmer white" },
      { label: "Hard boiled", tempC: 75, timeMin: 15, note: "Fully set throughout" }
    ]
  },
  vegetables: {
    label: "Vegetables",
    options: [
      { label: "Crunchy carrots", tempC: 85, timeMin: 30, note: "Retains bite" },
      { label: "Buttery potatoes", tempC: 88, timeMin: 60, note: "Tender, great for mashing" }
    ]
  }
};

export default function SousVideGuideWidget() {
  const [protein, setProtein] = useState("steak");
  const [idx, setIdx] = useState(1);

  const loadExample = () => {
    const v = getToolExample("sous-vide-guide").values;
    setProtein(exStr(v, "protein", "steak"));
    setIdx(exNum(v, "idx", 1));
  };

  const entry = DATA[protein];
  const opt = entry.options[idx] ?? entry.options[0];

  usePublishToolFacts("sous-vide-guide", {
    protein: { label: "Protein", value: entry.label },
    doneness: { label: "Doneness", value: opt.label },
    tempC: { label: "Water temperature", value: `${fmt(opt.tempC, 0)}°C` },
    tempF: { label: "Water temperature (F)", value: `${fmt((opt.tempC * 9) / 5 + 32, 0)}°F` },
    timeMin: { label: "Minimum time", value: `${opt.timeMin} minutes` }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <ExampleHelper
          hint="Cook a thick steak to medium-rare — water temperature and time."
          onExample={loadExample}
        />
        <Field label="Protein">
          <select
            className={selectCls}
            value={protein}
            onChange={(e) => {
              setProtein(e.target.value);
              setIdx(0);
            }}
          >
            {Object.entries(DATA).map(([key, e]) => (
              <option key={key} value={key}>
                {e.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {entry.options.map((o, i) => (
            <button
              key={o.label}
              onClick={() => setIdx(i)}
              className={`rounded-md border px-2 py-2 text-xs font-medium transition ${
                i === idx
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-ink-200 bg-white text-ink-600 hover:border-ink-300"
              }`}
            >
              {o.label}
              <span className="block text-[10px] text-ink-400">{o.tempC}°C</span>
            </button>
          ))}
        </div>
        <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">
          Times assume standard thickness (2–3 cm). Add ~25 minutes per extra 2.5 cm of
          thickness. Always finish with a quick sear for meats.
        </p>

      </div>

      <ResultCard title="Sous vide settings">
        <ResultRow label="Water temperature" value={`${fmt(opt.tempC, 0)}°C / ${fmt((opt.tempC * 9) / 5 + 32, 0)}°F`} strong />
        <ResultRow label="Minimum time" value={`${fmt(opt.timeMin, 0)} minutes`} />
        <ResultRow label="Texture" value={opt.note} />
        <p className="mt-3 rounded-lg border border-white/10 bg-white/10 p-3 text-xs leading-relaxed text-brand-100">
          <strong className="text-white">Finish:</strong> pat completely dry, then sear
          60–90 seconds per side in a ripping-hot pan (or use a blowtorch). Rest 2–3
          minutes before slicing.
        </p>
      </ResultCard>
    </div>
  );
}
