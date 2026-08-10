"use client";

import { useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import {
  Field,
  NumberInput,
  selectCls,
  ResultCard,
  ResultRow,
  CopyButton,
  ResetButton,
  ExampleHelper,
  useNumber,
  fmt,
  getToolExample,
  exStr
} from "./ui";
import { Coffee, Timer, Droplets, Scale, Info } from "lucide-react";
import {
  METHODS,
  ESPRESSO_STYLES,
  brewRatio,
  isBalancedRatio,
  brewStrength,
  espressoYieldPerShot,
  espressoTotals,
  GOLDEN_RULE_RATIO
} from "./coffeeMath";
import type { BrewMethod } from "./coffeeMath";

export default function CoffeeEspressoWidget() {
  const [method, setMethod] = useState<BrewMethod>("pour-over");
  const [coffee, setCoffee] = useState("20");
  const [water, setWater] = useState("320");
  const [shots, setShots] = useState("1");
  const [espressoStyle, setEspressoStyle] = useState("normale");

  const loadExample = () => {
    const v = getToolExample("coffee-espresso-calculator").values;
    setMethod(exStr(v, "method", "pour-over") as BrewMethod);
    setCoffee(exStr(v, "coffee", "20"));
    setWater(exStr(v, "water", "320"));
    setShots(exStr(v, "shots", "1"));
    setEspressoStyle(exStr(v, "espressoStyle", "normale"));
  };

  const coffeeG = useNumber(coffee);
  const waterMl = useNumber(water);
  const shotsN = Math.max(1, Math.round(useNumber(shots) || 1));

  const activeMethod = METHODS.find((m) => m.id === method)!;
  const ratio = brewRatio(waterMl, coffeeG);
  const isBalanced = isBalancedRatio(ratio, activeMethod.ratio);
  const strength = brewStrength(ratio, activeMethod.ratio);

  // Espresso: dose from style ratio and shot count
  const style = ESPRESSO_STYLES.find((s) => s.id === espressoStyle)!;
  const espressoDose = coffeeG; // user-entered dose per shot (grams)
  const espressoYield = espressoYieldPerShot(espressoDose, style.ratio[1]);
  const totals = espressoTotals(espressoDose, style.ratio[1], shotsN);
  const totalDose = totals.dose;
  const totalYield = totals.yield;

  usePublishToolFacts("coffee-espresso-calculator", {
    method: { label: "Brew method", value: activeMethod.label },
    coffee: { label: "Coffee dose", value: `${fmt(coffeeG, 1)} g` },
    water: { label: "Water", value: `${fmt(waterMl, 0)} ml` },
    ratio: { label: "Ratio", value: fmt(ratio, 1) },
    strength: { label: "Strength", value: strength },
    recMin: { label: "Recommended ratio min", value: String(activeMethod.ratio[0]) },
    recMax: { label: "Recommended ratio max", value: String(activeMethod.ratio[1]) },
    targetWater: {
      label: "Water for upper ratio",
      value: `${fmt(coffeeG * activeMethod.ratio[1], 0)} ml`
    },
    style: { label: "Shot style", value: style.label },
    shots: { label: "Shots", value: String(shotsN) },
    yield: { label: "Yield per shot", value: `${fmt(espressoYield, 1)} ml` },
    totalYield: { label: "Total yield", value: `${fmt(totalYield, 1)} ml` }
  });

  return (
    <div className="space-y-6">
      <ExampleHelper
        hint="Dial in 20 g of coffee with 320 ml of water for a pour-over."
        onExample={loadExample}
      />
      {/* Method picker */}
      <div>
        <p className="mb-2 text-sm font-medium text-ink-700">Brew method</p>
        <div className="flex flex-wrap gap-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                method === m.id
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-ink-200 bg-white text-ink-600 hover:border-brand-300"
              }`}
            >
              <span aria-hidden>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
          <Info className="h-3.5 w-3.5" />
          {activeMethod.desc}
        </p>
      </div>

      {method === "espresso" ? (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-ink-700">Shot style</p>
            <div className="flex flex-wrap gap-2">
              {ESPRESSO_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setEspressoStyle(s.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                    espressoStyle === s.id
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-ink-200 bg-white text-ink-600 hover:border-brand-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Dose per shot (g)" hint="Typical: 18 g for a double basket">
              <NumberInput value={coffee} onChange={setCoffee} min={1} placeholder="18" />
            </Field>
            <Field label="Number of shots">
              <NumberInput value={shots} onChange={setShots} min={1} step={1} placeholder="1" />
            </Field>
          </div>

          <ResultCard title="Espresso recipe" note={`Style: ${style.label} — ${style.desc}`}>
            <ResultRow
              label={`Yield per shot (${style.ratio[0]}:${style.ratio[1]})`}
              value={`${fmt(espressoYield, 1)} ml`}
              sub={`Dose ${fmt(espressoDose, 1)} g → yield ${fmt(espressoYield, 1)} ml`}
              strong
            />
            <ResultRow
              label="Total for your shots"
              value={`${fmt(totalDose, 1)} g → ${fmt(totalYield, 1)} ml`}
              sub={`${shotsN} × ${fmt(espressoDose, 1)} g`}
            />
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 p-3">
              <Timer className="h-4 w-4 text-copper-300" />
              <span className="text-xs text-brand-100">
                Pull time: aim for <strong>25–30 s</strong> for a 1:2 shot. Faster → under-extracted (sour); slower → over-extracted (bitter).
              </span>
            </div>
          </ResultCard>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Coffee (g)">
              <NumberInput value={coffee} onChange={setCoffee} min={1} placeholder="20" />
            </Field>
            <Field label="Water (ml)">
              <NumberInput value={water} onChange={setWater} min={1} placeholder="320" />
            </Field>
          </div>

          <ResultCard title="Your brew">
            <ResultRow
              label="Water : coffee ratio"
              value={`1 : ${fmt(ratio, 1)}`}
              sub={`Recommended ${activeMethod.ratio[0]}–${activeMethod.ratio[1]}`}
              strong
            />
            <ResultRow
              label="Brew strength"
              value={
                strength === "balanced"
                  ? "Balanced ✓"
                  : strength === "weak"
                    ? "Weak — add coffee"
                    : "Strong — add water"
              }
              sub={isBalanced ? "In the sweet spot for this method" : `Aim for 1:${activeMethod.ratio[0]}–${activeMethod.ratio[1]}`}
            />
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 p-3">
              <Scale className="h-4 w-4 text-copper-300" />
              <span className="text-xs text-brand-100">
                Golden rule: <strong>60 g of coffee per 1 liter of water</strong> (≈ 1:{fmt(GOLDEN_RULE_RATIO, 1)}).
              </span>
            </div>
          </ResultCard>
        </div>
      )}

      {/* Method guide table */}
      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        <div className="border-b border-ink-200 bg-ink-900 px-4 py-3 text-white">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <Coffee className="h-4 w-4 text-brand-300" />
            Quick brew ratio guide
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                <th className="px-4 py-2">Method</th>
                <th className="px-4 py-2">Ratio (water:coffee)</th>
                <th className="px-4 py-2">For 20 g coffee</th>
                <th className="px-4 py-2">Taste profile</th>
              </tr>
            </thead>
            <tbody>
              {METHODS.map((m) => (
                <tr key={m.id} className="border-b border-ink-100 last:border-0">
                  <td className="px-4 py-2 font-medium text-ink-800">{m.label}</td>
                  <td className="px-4 py-2 text-ink-600">
                    1:{m.ratio[0]}–{m.ratio[1]}
                  </td>
                  <td className="px-4 py-2 text-ink-600">
                    {fmt(20 * m.ratio[0], 0)}–{fmt(20 * m.ratio[1], 0)} ml
                  </td>
                  <td className="px-4 py-2 text-ink-500">{m.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-ink-400">
          <Droplets className="h-3.5 w-3.5" />
          Ratios are by weight — a scale beats a scoop every time.
        </div>
        <div className="flex gap-2">
          <CopyButton
            text={
              method === "espresso"
                ? `Espresso recipe: ${shotsN} shot(s) of ${fmt(espressoDose, 1)} g, ${style.label} (${style.ratio[0]}:${style.ratio[1]}), yield ${fmt(totalYield, 1)} ml. Pull 25-30 s.`
                : `Brew recipe: ${fmt(coffeeG, 1)} g coffee + ${fmt(waterMl, 0)} ml water = 1:${fmt(ratio, 1)} (${activeMethod.label}).`
            }
          />
          <ResetButton
            onReset={() => {
              setMethod("pour-over");
              setCoffee("20");
              setWater("320");
              setShots("1");
              setEspressoStyle("normale");
            }}
          />
        </div>
      </div>
    </div>
  );
}
