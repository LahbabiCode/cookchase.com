"use client";

import { useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import { Field, NumberInput, selectCls, ResultCard, ResultRow, ExampleHelper, fmt, getToolExample, exStr } from "./ui";

const VOLUME: Record<string, number> = {
  cup: 236.588,
  tbsp: 14.787,
  tsp: 4.929,
  "fl oz": 29.574,
  ml: 1,
  liter: 1000
};

const WEIGHT: Record<string, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592
};

const volumeUnits = Object.keys(VOLUME);
const weightUnits = Object.keys(WEIGHT);

export default function UnitConverterWidget() {
  const [category, setCategory] = useState<"volume" | "weight">("volume");
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState("cup");
  const [to, setTo] = useState("ml");

  const loadExample = () => {
    const v = getToolExample("unit-converter").values;
    setCategory(exStr(v, "category", "volume") as "volume" | "weight");
    setAmount(exStr(v, "amount", "2"));
    setFrom(exStr(v, "from", "cup"));
    setTo(exStr(v, "to", "ml"));
  };

  const table = category === "volume" ? VOLUME : WEIGHT;
  const unitList = category === "volume" ? volumeUnits : weightUnits;

  const value = parseFloat(amount) || 0;
  const result = (value * table[from]) / table[to];

  const commonEquiv = (() => {
    if (category === "volume") {
      const inMl = value * table[from];
      if (inMl >= 950) return `${fmt(inMl / 1000, 2)} liters`;
      return `${fmt(inMl, 0)} milliliters`;
    }
    const inG = value * table[from];
    if (inG >= 900) return `${fmt(inG / 1000, 2)} kg`;
    return `${fmt(inG, 1)} grams`;
  })();

  usePublishToolFacts("unit-converter", {
    amount: { label: "Amount", value: fmt(value, 3) },
    from: { label: "From", value: from },
    to: { label: "To", value: to },
    result: { label: "Result", value: `${fmt(result, 3)} ${to}` },
    category: { label: "Category", value: category }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <ExampleHelper
          hint="Convert 2 cups of milk to milliliters — see the result instantly."
          onExample={loadExample}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select
              className={selectCls}
              value={category}
              onChange={(e) => {
                const c = e.target.value as "volume" | "weight";
                setCategory(c);
                setFrom(c === "volume" ? "cup" : "g");
                setTo(c === "volume" ? "ml" : "oz");
              }}
            >
              <option value="volume">Volume</option>
              <option value="weight">Weight</option>
            </select>
          </Field>
          <Field label="Amount">
            <NumberInput value={amount} onChange={setAmount} placeholder="1" />
          </Field>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <Field label="From">
            <select className={selectCls} value={from} onChange={(e) => setFrom(e.target.value)}>
              {unitList.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
          <span className="pb-2 text-lg text-ink-400">→</span>
          <Field label="To">
            <select className={selectCls} value={to} onChange={(e) => setTo(e.target.value)}>
              {unitList.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>
        </div>

      </div>

      <ResultCard title="Conversion result">
        <ResultRow
          label={`${value} ${from}`}
          value={`${fmt(result, 3)} ${to}`}
          strong
        />
        <ResultRow label="Also equals" value={commonEquiv} />
        {category === "weight" && (
          <ResultRow
            label="US cups (approx.)"
            value={result >= 50 ? "— use volume mode" : `${fmt(result / 120, 2)} cups`}
          />
        )}
      </ResultCard>
    </div>
  );
}
