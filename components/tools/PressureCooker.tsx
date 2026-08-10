"use client";

import { useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import { Field, NumberInput, selectCls, ResultCard, ResultRow, ExampleHelper, fmt, getToolExample, exStr } from "./ui";

interface Food {
  label: string;
  baseMin: number; // minutes at HIGH pressure for the base weight
  baseGrams: number; // weight the base time applies to (0 = fixed, weight-independent)
  release: string;
  note: string;
}

const FOODS: Record<string, Food> = {
  chickenBreast: {
    label: "Chicken breast (frozen ok)",
    baseMin: 8,
    baseGrams: 500,
    release: "Quick release",
    note: "Juicy and fully safe at 8 min for 500 g. Let it rest before slicing."
  },
  chickenThighs: {
    label: "Chicken thighs",
    baseMin: 12,
    baseGrams: 500,
    release: "Quick release",
    note: "Fall-apart tender; great for shredding."
  },
  wholeChicken: {
    label: "Whole chicken (~1.5 kg)",
    baseMin: 25,
    baseGrams: 1500,
    release: "Natural release 10 min",
    note: "Rest 5 minutes after releasing before carving."
  },
  beefChuck: {
    label: "Beef chuck (stew chunks)",
    baseMin: 35,
    baseGrams: 1000,
    release: "Natural release 15 min",
    note: "Perfect for pot roast and shredded beef."
  },
  porkShoulder: {
    label: "Pork shoulder (pulled pork)",
    baseMin: 60,
    baseGrams: 1500,
    release: "Natural release 15 min",
    note: "Shreds beautifully — the pressure cooker's classic."
  },
  porkRibs: {
    label: "Pork ribs",
    baseMin: 25,
    baseGrams: 1000,
    release: "Natural release 10 min",
    note: "Finish under the broiler with sauce for 3 minutes."
  },
  soakedBeans: {
    label: "Dry beans (pre-soaked)",
    baseMin: 10,
    baseGrams: 500,
    release: "Natural release 10 min",
    note: "Soak overnight to cut the time in half and improve digestibility."
  },
  unsoakedBeans: {
    label: "Dry beans (unsoaked)",
    baseMin: 35,
    baseGrams: 500,
    release: "Natural release 15 min",
    note: "Kidney beans must be cooked to safe temps — never eat undercooked."
  },
  whiteRice: {
    label: "White rice",
    baseMin: 4,
    baseGrams: 0,
    release: "Natural release 10 min",
    note: "Fixed 4 min on high, then natural release for fluffy rice."
  },
  potatoes: {
    label: "Potatoes (halved)",
    baseMin: 8,
    baseGrams: 800,
    release: "Quick release",
    note: "Perfect for mashed potatoes — they'll be very soft."
  },
  hardEggs: {
    label: "Hard-boiled eggs",
    baseMin: 5,
    baseGrams: 0,
    release: "Natural release 5 min",
    note: "Fixed 5 min on high. Plunge into ice water after releasing."
  },
  vegetables: {
    label: "Vegetables (steamed)",
    baseMin: 2,
    baseGrams: 0,
    release: "Quick release",
    note: "Just 2 minutes — pressure cookers obliterate vegetables fast."
  }
};

export default function PressureCookerWidget() {
  const [food, setFood] = useState("beefChuck");
  const [weight, setWeight] = useState("1000");

  const loadExample = () => {
    const v = getToolExample("pressure-cooker-converter").values;
    setFood(exStr(v, "food", "porkShoulder"));
    setWeight(exStr(v, "weight", "1500"));
  };

  const conf = FOODS[food];
  const w = parseFloat(weight) || 0;
  const minutes =
    conf.baseGrams > 0
      ? Math.round((conf.baseMin * w) / conf.baseGrams)
      : conf.baseMin;
  const total = minutes + 12 + (conf.release.includes("Natural") ? 15 : 0);

  usePublishToolFacts("pressure-cooker-converter", {
    food: { label: "Food", value: conf.label },
    weight: { label: "Weight", value: conf.baseGrams > 0 ? `${fmt(w, 0)} g` : "fixed" },
    minutes: { label: "High-pressure time", value: `${fmt(minutes, 0)} min` },
    release: { label: "Release method", value: conf.release }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <ExampleHelper
          hint="Cook 1.5 kg of pork shoulder for pulled pork — 60 min at high pressure."
          onExample={loadExample}
        />
        <Field label="What are you cooking?">
          <select className={selectCls} value={food} onChange={(e) => setFood(e.target.value)}>
            {Object.entries(FOODS).map(([key, f]) => (
              <option key={key} value={key}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>
        {conf.baseGrams > 0 && (
          <Field label="Weight (g)" hint={`Base time of ${conf.baseMin} min applies to ${fmt(conf.baseGrams, 0)} g`}>
            <NumberInput value={weight} onChange={setWeight} min={50} />
          </Field>
        )}
        <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">
          Times assume HIGH pressure at sea level on a standard 6–8 quart electric or
          stovetop cooker. Add ~5% time for every 300 m above 1,000 m altitude.
        </p>

      </div>

      <ResultCard title="Pressure cooking plan">
        <ResultRow label="Cook at HIGH pressure" value={`${fmt(minutes, 0)} min`} strong />
        <ResultRow label="Release method" value={conf.release} />
        <ResultRow
          label="Est. total time"
          value={`~${fmt(total, 0)} min`}
          sub="includes pressurizing & release"
        />
        <p className="mt-3 rounded-lg border border-white/10 bg-white/10 p-3 text-xs leading-relaxed text-brand-100">
          {conf.note}
        </p>
      </ResultCard>
    </div>
  );
}
