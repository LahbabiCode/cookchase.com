"use client";

import { useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import { Field, NumberInput, SliderInput, ResultCard, ResultRow, ExampleHelper, fmt, getToolExample, exStr, exNum } from "./ui";

export default function PizzaDoughCalculatorWidget() {
  const [pizzas, setPizzas] = useState("2");
  const [ballWeight, setBallWeight] = useState("280");
  const [hydration, setHydration] = useState(65);
  const [yeastPct, setYeastPct] = useState(0.3);

  const loadExample = () => {
    const v = getToolExample("pizza-dough-calculator").values;
    setPizzas(exStr(v, "pizzas", "2"));
    setBallWeight(exStr(v, "ballWeight", "280"));
    setHydration(exNum(v, "hydration", 65));
    setYeastPct(exNum(v, "yeastPct", 0.3));
  };

  const n = parseInt(pizzas) || 0;
  const bw = parseFloat(ballWeight) || 0;
  const saltPct = 0.025;
  const oilPct = 0.02;

  const total = n * bw;
  const flour = total / (1 + hydration / 100 + saltPct + yeastPct / 100 + oilPct);
  const water = flour * (hydration / 100);
  const salt = flour * saltPct;
  const yeast = flour * (yeastPct / 100);
  const oil = flour * oilPct;

  const texture =
    hydration < 58
      ? "Stiff and cracker-like — great for thin crust"
      : hydration < 62
        ? "Firm and easy to handle — New York style"
        : hydration < 68
          ? "Classic Neapolitan — soft, slightly tacky"
          : hydration < 75
            ? "Wet and slack — needs folding, very airy"
            : "Very high hydration — advanced bakers only";

  usePublishToolFacts("pizza-dough-calculator", {
    pizzas: { label: "Pizzas", value: fmt(n, 0) },
    ballWeight: { label: "Dough ball", value: `${fmt(bw, 0)} g` },
    hydration: { label: "Hydration", value: `${hydration}%` },
    flour: { label: "Flour", value: `${fmt(flour, 0)} g` },
    water: { label: "Water", value: `${fmt(water, 0)} ml` },
    salt: { label: "Salt", value: `${fmt(salt, 1)} g` },
    yeast: { label: "Yeast", value: `${fmt(yeast, 2)} g` },
    total: { label: "Total dough", value: `${fmt(total, 0)} g` },
    texture: { label: "Texture", value: texture }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <ExampleHelper
          hint="Make 2 Neapolitan pizzas with 280 g dough balls at 65% hydration."
          onExample={loadExample}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Number of pizzas">
            <NumberInput value={pizzas} onChange={setPizzas} min={1} />
          </Field>
          <Field label="Dough ball weight (g)" hint="250–300 g is standard for 12-inch pizzas">
            <NumberInput value={ballWeight} onChange={setBallWeight} min={50} />
          </Field>
        </div>

        <Field label="Hydration" hint="Flour is always 100%; water is a percentage of it">
          <SliderInput
            value={hydration}
            onChange={setHydration}
            min={55}
            max={80}
            step={1}
            display={(v) => `${v}%`}
          />
        </Field>

        <Field label="Instant yeast">
          <SliderInput
            value={yeastPct}
            onChange={setYeastPct}
            min={0.1}
            max={1}
            step={0.05}
            display={(v) => `${v.toFixed(2)}%`}
          />
        </Field>

        <p className="rounded-lg bg-ink-50 p-3 text-xs text-ink-500">{texture}</p>

      </div>

      <ResultCard title="Dough recipe" note="Baker's percentages: 100% flour, 2.5% salt, 2% olive oil.">
        <ResultRow label="Flour" value={`${fmt(flour, 0)} g`} strong />
        <ResultRow label="Water" value={`${fmt(water, 0)} ml`} strong />
        <ResultRow label="Salt" value={`${fmt(salt, 1)} g`} />
        <ResultRow label="Instant yeast" value={`${fmt(yeast, 2)} g`} />
        <ResultRow label="Olive oil" value={`${fmt(oil, 1)} g`} />
        <ResultRow label="Total dough" value={`${fmt(total, 0)} g`} sub={`${fmt(n, 0)} × ${fmt(bw, 0)} g balls`} />
        <p className="mt-3 rounded-lg border border-white/10 bg-white/10 p-3 text-xs leading-relaxed text-brand-100">
          <strong className="text-white">Fermentation:</strong> 2–4 hours at room temp,
          or 24–72 hours cold-fermented in the fridge for maximum flavor.
        </p>
      </ResultCard>
    </div>
  );
}
