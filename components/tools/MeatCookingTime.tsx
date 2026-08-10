"use client";

import { useState } from "react";
import { Field, selectCls, ResultCard, ResultRow, ExampleHelper, fmt, getToolExample, exStr } from "./ui";
import ProToolActions from "./ProToolActions";
import { useFavorites } from "@/lib/useFavorites";
import { usePublishToolFacts } from "./faqStore";

const MEATS: Record<
  string,
  {
    label: string;
    perKgMin: number;
    perKgMax: number;
    doneness?: { label: string; tempC: number }[];
    fixedTemp?: string;
    note: string;
  }
> = {
  beefRoast: {
    label: "Beef roast (boneless)",
    perKgMin: 30,
    perKgMax: 35,
    doneness: [
      { label: "Rare", tempC: 52 },
      { label: "Medium rare", tempC: 56 },
      { label: "Medium", tempC: 60 },
      { label: "Well done", tempC: 71 }
    ],
    note: "Rest 15–20 minutes; temperature rises 3–5°C while resting."
  },
  chickenWhole: {
    label: "Whole chicken",
    perKgMin: 40,
    perKgMax: 50,
    fixedTemp: "74°C (165°F) in the thigh",
    note: "Rest 10–15 minutes before carving."
  },
  turkey: {
    label: "Turkey (whole)",
    perKgMin: 25,
    perKgMax: 30,
    fixedTemp: "74°C (165°F) in the thigh",
    note: "Loosely tent foil if browning too fast; rest 20–30 min."
  },
  porkLoin: {
    label: "Pork loin roast",
    perKgMin: 30,
    perKgMax: 35,
    doneness: [{ label: "Medium", tempC: 63 }],
    note: "USDA now allows 63°C with a 3-minute rest."
  },
  lambLeg: {
    label: "Leg of lamb",
    perKgMin: 30,
    perKgMax: 35,
    doneness: [
      { label: "Medium rare", tempC: 57 },
      { label: "Medium", tempC: 63 }
    ],
    note: "Rest 15 minutes; carry-over cooking adds a few degrees."
  },
  fish: {
    label: "Fish (whole or fillet)",
    perKgMin: 15,
    perKgMax: 20,
    fixedTemp: "flaky at 63°C",
    note: "Fish cooks fast — check at the low end of the range."
  }
};

export default function MeatCookingTimeWidget() {
  const { settings } = useFavorites();
  // Imperial users enter pounds and read °F first; metric users enter kg and °C.
  const imperial = settings.units === "imperial";
  const [meat, setMeat] = useState("beefRoast");
  const [weight, setWeight] = useState("1.5");
  const [unit, setUnit] = useState<"kg" | "lb">(imperial ? "lb" : "kg");
  const [donenessIdx, setDonenessIdx] = useState(2);

  const loadExample = () => {
    const v = getToolExample("meat-cooking-time").values;
    setMeat(exStr(v, "meat", "chickenWhole"));
    setWeight(exStr(v, "weight", "1.5"));
    setUnit(imperial ? "lb" : "kg");
  };

  const config = MEATS[meat];
  const w = parseFloat(weight) || 0;
  const wKg = unit === "kg" ? w : w * 0.4536;

  const minMin = wKg * config.perKgMin;
  const maxMin = wKg * config.perKgMax;
  const temp = config.fixedTemp
    ? config.fixedTemp
    : config.doneness?.[donenessIdx]?.tempC
      ? imperial
        ? `${fmt((config.doneness[donenessIdx].tempC * 9) / 5 + 32, 0)}°F / ${config.doneness[donenessIdx].tempC}°C`
        : `${config.doneness[donenessIdx].tempC}°C / ${fmt(
            (config.doneness[donenessIdx].tempC * 9) / 5 + 32,
            0
          )}°F`
      : "—";

  usePublishToolFacts("meat-cooking-time", {
    meat: { label: "Cut", value: config.label },
    weightKg: { label: "Weight", value: `${fmt(wKg, 2)} kg` },
    timeMin: { label: "Min time", value: fmt(minMin, 0) },
    timeMax: { label: "Max time", value: fmt(maxMin, 0) },
    temp: { label: "Target internal temp", value: temp }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <ExampleHelper
          hint="Roast a 1.5 kg whole chicken and get its exact cook time and target temp."
          onExample={loadExample}
        />
        <Field label="Meat type">
          <select className={selectCls} value={meat} onChange={(e) => setMeat(e.target.value)}>
            {Object.entries(MEATS).map(([key, m]) => (
              <option key={key} value={key}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Weight">
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <select
                className={selectCls}
                style={{ width: 76 }}
                value={unit}
                onChange={(e) => setUnit(e.target.value as "kg" | "lb")}
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </Field>
          <div className="flex items-end pb-2 text-sm text-ink-500">
            ≈ {fmt(wKg, 2)} kg {unit === "lb" ? "· " + fmt(w, 1) + " lb" : ""}
          </div>
        </div>

        {config.doneness && (
          <div>
            <p className="mb-2 text-sm font-medium text-ink-700">Doneness</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {config.doneness.map((d, i) => (
                <button
                  key={d.label}
                  onClick={() => setDonenessIdx(i)}
                  className={`rounded-md border px-2 py-2 text-xs font-medium transition ${
                    donenessIdx === i
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-ink-200 bg-white text-ink-600 hover:border-ink-300"
                  }`}
                >
                  {d.label}
                  <span className="block text-[10px] text-ink-400">
                    {imperial ? `${fmt((d.tempC * 9) / 5 + 32, 0)}°F` : `${d.tempC}°C`}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">{config.note}</p>

      </div>

      <ResultCard title="Your roast plan">
        <ResultRow
          label="Cooking time"
          value={`${fmt(minMin, 0)}–${fmt(maxMin, 0)} min`}
          sub={
            imperial
              ? `for ${fmt(wKg * 2.2046, 1)} lb (${fmt(wKg, 2)} kg)`
              : `for ${fmt(wKg, 2)} kg (${fmt(wKg * 2.2046, 1)} lb)`
          }
          strong
        />
        <ResultRow label="Target internal temp" value={temp} />
        <ResultRow
          label="Resting time"
          value={meat === "chickenWhole" ? "10–15 min" : meat === "turkey" ? "20–30 min" : "15–20 min"}
          sub="carry-over cooking adds 3–5°C"
        />
      </ResultCard>

      <ProToolActions
        toolSlug="meat-cooking-time"
        toolName="Meat Cooking Time Calculator"
        rows={[
          { label: "Cut", value: config.label },
          { label: "Weight", value: `${fmt(wKg, 2)} kg (${fmt(wKg * 2.2046, 1)} lb)` },
          { label: "Cooking time", value: `${fmt(minMin, 0)}–${fmt(maxMin, 0)} min` },
          { label: "Target internal temp", value: temp },
          {
            label: "Resting time",
            value:
              meat === "chickenWhole"
                ? "10–15 min"
                : meat === "turkey"
                  ? "20–30 min"
                  : "15–20 min"
          }
        ]}
      />
    </div>
  );
}
