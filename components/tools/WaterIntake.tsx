"use client";

import { useState } from "react";
import { Field, NumberInput, selectCls, SliderInput, ResultCard, ResultRow, ExampleHelper, fmt, getToolExample, exStr, exNum } from "./ui";
import ProToolActions from "./ProToolActions";
import { usePublishToolFacts } from "./faqStore";
import { useToolStrings } from "@/lib/tool-i18n";

export default function WaterIntakeWidget() {
  const ts = useToolStrings("water-intake");
  const [weight, setWeight] = useState("70");
  const [unit, setUnit] = useState<"kg" | "lb">("kg");
  const [activity, setActivity] = useState(30);
  const [climate, setClimate] = useState("mild");

  const loadExample = () => {
    const v = getToolExample("water-intake").values;
    setWeight(exStr(v, "weight", "70"));
    setUnit(exStr(v, "unit", "kg") as "kg" | "lb");
    setActivity(exNum(v, "activity", 45));
    setClimate(exStr(v, "climate", "mild"));
  };

  const w = parseFloat(weight) || 0;
  const wKg = unit === "kg" ? w : w * 0.4536;
  const baseline = wKg * 30;
  const activityExtra = Math.floor(activity / 30) * 350;
  const climateExtra = { mild: 0, hot: 300, veryHot: 600 }[climate] ?? 0;
  const total = baseline + activityExtra + climateExtra;
  const cups = total / 240;

  usePublishToolFacts("water-intake", {
    weight: { label: ts("bodyWeight"), value: fmt(w, 0) },
    unit: { label: ts("unit"), value: unit === "kg" ? "kg" : "lb" },
    exercise: { label: ts("exercise"), value: `${activity} min` },
    climate: { label: ts("climate"), value: climate === "veryHot" ? ts("veryHot") : climate },
    total: { label: ts("target"), value: `${fmt(total, 0)} ml` },
    cups: { label: ts("inCups"), value: `${fmt(cups, 0)} cups (240 ml)` },
    exerciseExtra: { label: ts("exerciseBonus"), value: `+${fmt(activityExtra, 0)} ml` }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <ExampleHelper
          hint={ts("waterHint")}
          onExample={loadExample}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label={ts("bodyWeight")}>
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
          <Field label={ts("climate")}>
            <select
              className={selectCls}
              value={climate}
              onChange={(e) => setClimate(e.target.value)}
            >
              <option value="mild">{ts("mild")}</option>
              <option value="hot">{ts("hot")}</option>
              <option value="veryHot">{ts("veryHot")}</option>
            </select>
          </Field>
        </div>

        <Field label={ts("exercise")} hint={ts("exerciseHint")}>
          <SliderInput
            value={activity}
            onChange={setActivity}
            min={0}
            max={180}
            step={15}
            display={(v) => `${v} min`}
          />
        </Field>

      </div>

      <ResultCard title={ts("target")}>
        <ResultRow label={ts("total")} value={`${fmt(total, 0)} ml`} strong />
        <ResultRow label={ts("inLiters")} value={`${fmt(total / 1000, 2)} L`} />
        <ResultRow label={ts("inCups")} value={`${fmt(cups, 0)} cups (240 ml)`} />
        <ResultRow label={ts("baseline")} value={`${fmt(baseline, 0)} ml`} />
        <ResultRow label={ts("exerciseBonus")} value={`+${fmt(activityExtra, 0)} ml`} />
        <ResultRow label={ts("climateBonus")} value={`+${fmt(climateExtra, 0)} ml`} />
        <p className="mt-3 rounded-lg border border-white/10 bg-white/10 p-3 text-xs leading-relaxed text-brand-100">
          <strong className="text-white">{ts("check")}</strong> {ts("checkNote")}
        </p>
      </ResultCard>

      <ProToolActions
        toolSlug="water-intake"
        toolName={ts("target")}
        rows={[
          { label: ts("total"), value: `${fmt(total, 0)} ml` },
          { label: ts("inLiters"), value: `${fmt(total / 1000, 2)} L` },
          { label: ts("inCups"), value: `${fmt(cups, 0)} cups (240 ml)` },
          { label: ts("baseline"), value: `${fmt(baseline, 0)} ml` },
          { label: ts("exerciseBonus"), value: `+${fmt(activityExtra, 0)} ml` },
          { label: ts("climateBonus"), value: `+${fmt(climateExtra, 0)} ml` }
        ]}
      />
    </div>
  );
}
