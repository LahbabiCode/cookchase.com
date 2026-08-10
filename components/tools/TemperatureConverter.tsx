"use client";

import { useEffect, useRef, useState } from "react";
import { NumberInput, ResultCard, ResultRow, ExampleHelper, fmt, getToolExample, exStr } from "./ui";
import ProToolActions from "./ProToolActions";
import { useFavorites } from "@/lib/useFavorites";
import { usePublishToolFacts } from "./faqStore";

const presets = [
  { label: "Slow", f: 300 },
  { label: "Moderate", f: 350 },
  { label: "Hot", f: 400 },
  { label: "Very hot", f: 425 },
  { label: "Pizza", f: 450 }
];

export default function TemperatureConverterWidget() {
  const { settings } = useFavorites();
  // Prefer the synced units setting (imperial → Fahrenheit, metric → Celsius).
  const preferred: "f" | "c" = settings.units === "imperial" ? "f" : "c";
  const [mode, setMode] = useState<"f" | "c">(preferred);
  const [value, setValue] = useState("350");
  // Once the user picks a unit themselves, stop following the preference.
  const touched = useRef(false);

  useEffect(() => {
    if (!touched.current) setMode(preferred);
  }, [preferred]);

  const loadExample = () => {
    const v = getToolExample("temperature-converter").values;
    setMode(exStr(v, "mode", "f") as "f" | "c");
    setValue(exStr(v, "value", "350"));
  };

  const chooseMode = (m: "f" | "c") => {
    touched.current = true;
    setMode(m);
  };

  const v = parseFloat(value) || 0;
  const f = mode === "f" ? v : (v * 9) / 5 + 32;
  const c = mode === "c" ? v : ((v - 32) * 5) / 9;
  const gas = Math.round(c / 140 - 1);
  const fan = c - 20;

  usePublishToolFacts("temperature-converter", {
    value: { label: "Temperature", value: fmt(v, 0) },
    mode: { label: "Unit", value: mode === "f" ? "F" : "C" },
    f: { label: "Fahrenheit", value: `${fmt(f, 1)} °F` },
    c: { label: "Celsius", value: `${fmt(c, 1)} °C` },
    gas: { label: "Gas mark", value: gas >= 1 ? `Mark ${gas}` : "below mark 1" },
    fan: { label: "Fan oven", value: `${fmt(fan, 0)} °C` }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <ExampleHelper
          hint="Set 350°F and see the Celsius, gas-mark and fan-oven equivalents."
          onExample={loadExample}
        />
        <div className="grid grid-cols-2 gap-4">
          <div className="grid grid-cols-2 overflow-hidden rounded-md border border-ink-200 text-sm font-medium">
            {(["f", "c"] as const).map((m) => (
              <button
                key={m}
                onClick={() => chooseMode(m)}
                className={`px-3 py-2 transition ${
                  mode === m
                    ? "bg-brand-600 text-white"
                    : "bg-white text-ink-600 hover:bg-ink-50"
                }`}
              >
                {m === "f" ? "°Fahrenheit" : "°Celsius"}
              </button>
            ))}
          </div>
          <div />
        </div>
        <NumberInput value={value} onChange={setValue} placeholder="350" />

        <div>
          <p className="mb-2 text-sm font-medium text-ink-700">Common presets</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.f}
                onClick={() => {
                  setMode("f");
                  setValue(String(p.f));
                }}
                className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:border-brand-400 hover:text-brand-600"
              >
                {p.label} · {p.f}°F
              </button>
            ))}
          </div>
        </div>

      </div>

      <ResultCard title="Converted temperatures">
        <ResultRow label="Fahrenheit" value={`${fmt(f, 1)} °F`} strong={mode === "f"} />
        <ResultRow label="Celsius" value={`${fmt(c, 1)} °C`} strong={mode === "c"} />
        <ResultRow label="Gas mark" value={gas >= 1 ? `Mark ${gas}` : "Below mark 1"} />
        <ResultRow
          label="Fan oven"
          value={`${fmt(fan, 0)} °C`}
          sub="reduce by 20°C for convection"
        />
      </ResultCard>

      <ProToolActions
        toolSlug="temperature-converter"
        toolName="Temperature Converter"
        rows={[
          { label: "Fahrenheit", value: `${fmt(f, 1)} °F` },
          { label: "Celsius", value: `${fmt(c, 1)} °C` },
          { label: "Gas mark", value: gas >= 1 ? `Mark ${gas}` : "Below mark 1" },
          { label: "Fan oven", value: `${fmt(fan, 0)} °C`, sub: "reduce by 20°C for convection" }
        ]}
      />
    </div>
  );
}
