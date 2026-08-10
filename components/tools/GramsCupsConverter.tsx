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
import ProToolActions from "./ProToolActions";
import { useIngredientDensities } from "./useIngredientDensities";
import {
  volumeToGrams,
  gramsToVolume,
  gramsEquivalents,
  densityFor
} from "./gramsCupsMath";
import type { Unit } from "./gramsCupsMath";
import { Scale, ArrowRightLeft, Info } from "lucide-react";

type Direction = "volume-to-weight" | "weight-to-volume";

export default function GramsCupsWidget() {
  const { densities, densityMap } = useIngredientDensities();
  const [ingredient, setIngredient] = useState("All-purpose flour");
  const [direction, setDirection] = useState<Direction>("volume-to-weight");
  const [amount, setAmount] = useState("1");
  const [unit, setUnit] = useState<Unit>("cup");
  const [grams, setGrams] = useState("125");

  const loadExample = () => {
    const v = getToolExample("grams-cups-converter").values;
    setIngredient(exStr(v, "ingredient", "Honey"));
    setDirection(exStr(v, "direction", "volume-to-weight") as Direction);
    setAmount(exStr(v, "amount", "1"));
    setUnit(exStr(v, "unit", "cup") as Unit);
    setGrams(exStr(v, "grams", "340"));
  };

  const gPerCup = densityFor(ingredient, densityMap);
  const amt = useNumber(amount);
  const g = useNumber(grams);

  // Computed values for the active direction
  const computed =
    direction === "volume-to-weight"
      ? volumeToGrams(amt, gPerCup, unit)
      : gramsToVolume(g, gPerCup, unit);

  // Full equivalence table (always in grams + cups/tbsp/tsp)
  const gValue = direction === "volume-to-weight" ? computed : g;
  const equivalents = gramsEquivalents(gValue, gPerCup);
  const cups = equivalents.cups;

  const swap = () => {
    if (direction === "volume-to-weight") {
      setGrams(String(Math.round(computed * 10) / 10));
      setDirection("weight-to-volume");
    } else {
      const targetUnit: Unit = "cup";
      setAmount(String(Math.round(computed * 100) / 100));
      setUnit(targetUnit);
      setDirection("volume-to-weight");
    }
  };

  usePublishToolFacts("grams-cups-converter", {
    ingredient: { label: "Ingredient", value: ingredient },
    density: { label: "Density", value: `${gPerCup} g/cup` },
    amount: { label: "Amount", value: fmt(amt, 2) },
    unit: { label: "Unit", value: unit },
    grams: { label: "Weight", value: `${fmt(gValue, 1)} g` },
    direction: { label: "Direction", value: direction }
  });

  return (
    <div className="space-y-6">
      <ExampleHelper
        hint="Convert 1 cup of honey to grams — honey weighs more than flour."
        onExample={loadExample}
      />
      <Field label="Ingredient">
        <select
          className={selectCls}
          value={ingredient}
          onChange={(e) => setIngredient(e.target.value)}
        >
          {densities.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name} — {d.gPerCup} g/cup
            </option>
          ))}
        </select>
      </Field>

      {/* Direction toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDirection("volume-to-weight")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            direction === "volume-to-weight"
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-ink-200 bg-white text-ink-600 hover:border-brand-300"
          }`}
        >
          Cups → Grams
        </button>
        <button
          onClick={swap}
          aria-label="Swap direction"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-500 transition hover:border-brand-400 hover:text-brand-600"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setDirection("weight-to-volume")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            direction === "weight-to-volume"
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-ink-200 bg-white text-ink-600 hover:border-brand-300"
          }`}
        >
          Grams → Cups
        </button>
      </div>

      {direction === "volume-to-weight" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount">
            <NumberInput value={amount} onChange={setAmount} min={0} placeholder="1" />
          </Field>
          <Field label="Unit">
            <select
              className={selectCls}
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
            >
              <option value="cup">Cups</option>
              <option value="tbsp">Tablespoons</option>
              <option value="tsp">Teaspoons</option>
            </select>
          </Field>
        </div>
      ) : (
        <Field label="Weight (grams)">
          <NumberInput value={grams} onChange={setGrams} min={0} placeholder="125" />
        </Field>
      )}

      <ResultCard
        title={direction === "volume-to-weight" ? "Weight" : "Volume"}
        note={`${ingredient}: ${gPerCup} g per cup (US standard)`}
      >
        {direction === "volume-to-weight" ? (
          <ResultRow
            label="Grams"
            value={`${fmt(computed, 1)} g`}
            sub={`${amt} ${unit}${amt !== 1 ? "s" : ""}`}
            strong
          />
        ) : (
          <ResultRow
            label="Cups"
            value={`${fmt(computed, 2)} cups`}
            sub={`${g} g`}
            strong
          />
        )}
        <ResultRow
          label="Cups"
          value={`${fmt(equivalents.cups, 2)}`}
          sub="rounded for convenience"
        />
        <ResultRow
          label="Tablespoons"
          value={`${fmt(equivalents.tbsp, 1)} tbsp`}
        />
        <ResultRow
          label="Teaspoons"
          value={`${fmt(equivalents.tsp, 0)} tsp`}
        />
      </ResultCard>

      <ProToolActions
        toolSlug="grams-cups-converter"
        toolName="Grams ↔ Cups Converter"
        rows={[
          {
            label: "Ingredient",
            value: `${ingredient} (${gPerCup} g/cup)`
          },
          {
            label: direction === "volume-to-weight" ? "Weight" : "Volume",
            value:
              direction === "volume-to-weight"
                ? `${fmt(computed, 1)} g (${amt} ${unit})`
                : `${fmt(computed, 2)} cups (${g} g)`
          },
          { label: "Cups", value: `${fmt(equivalents.cups, 2)}` },
          { label: "Tablespoons", value: `${fmt(equivalents.tbsp, 1)} tbsp` },
          { label: "Teaspoons", value: `${fmt(equivalents.tsp, 0)} tsp` }
        ]}
      />

      <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-ink-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <span>
          A cup of flour (125 g) and a cup of honey (340 g) weigh very differently. Always use the
          ingredient-specific value above — generic "cup = 240 g" conversions are wrong for almost
          everything except water.
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <CopyButton
          text={`${direction === "volume-to-weight" ? `${amt} ${unit} of ${ingredient}` : `${g} g of ${ingredient}`} = ${fmt(cups, 2)} cups (${fmt(gValue, 1)} g). ${ingredient}: ${gPerCup} g/cup.`}
        />
        <ResetButton
          onReset={() => {
            setIngredient("All-purpose flour");
            setDirection("volume-to-weight");
            setAmount("1");
            setUnit("cup");
            setGrams("125");
          }}
        />
      </div>
    </div>
  );
}
