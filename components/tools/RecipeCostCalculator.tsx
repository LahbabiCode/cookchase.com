"use client";

import { useState } from "react";
import {
  Field,
  NumberInput,
  inputCls,
  ResultCard,
  ResultRow,
  AddRowButton,
  RemoveButton,
  ResetButton,
  ExampleHelper,
  useNumber,
  fmt,
  getToolExample,
  exStr,
  exArr
} from "./ui";
import { useFoodPrices } from "./useFoodPrices";
import { estimateCost, findPricePerKg } from "./foodPrices";
import { usePublishToolFacts } from "./faqStore";

interface Ing {
  name: string;
  amount: string;
  price: string;
  packageSize: string;
}

const currency = "$";

export default function RecipeCostCalculatorWidget() {
  const { priceMap, loading } = useFoodPrices();
  const [servings, setServings] = useState("4");
  const [rows, setRows] = useState<Ing[]>([
    { name: "Chicken thighs", amount: "600", price: "4.5", packageSize: "600" },
    { name: "Rice", amount: "200", price: "2.4", packageSize: "1000" },
    { name: "Tomatoes", amount: "300", price: "1.8", packageSize: "500" }
  ]);

  const loadExample = () => {
    const v = getToolExample("recipe-cost-calculator").values;
    setServings(exStr(v, "servings", "4"));
    setRows(
      exArr<Ing>(v, "rows", [
        { name: "Spaghetti", amount: "400", price: "1.5", packageSize: "500" },
        { name: "Ground beef", amount: "500", price: "6", packageSize: "500" },
        { name: "Tomato passata", amount: "700", price: "2", packageSize: "700" },
        { name: "Onion", amount: "150", price: "0.5", packageSize: "150" },
        { name: "Parmesan", amount: "50", price: "4", packageSize: "200" }
      ])
    );
  };

  const sv = useNumber(servings);
  const update = (i: number, patch: Partial<Ing>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  // Cost per row: the visitor's own price wins when provided; otherwise fall
  // back to the average supermarket price from the admin-editable library and
  // flag the row as estimated.
  const costed = rows.map((r) => {
    const amount = useNumber(r.amount);
    const pkg = useNumber(r.packageSize);
    const price = useNumber(r.price);
    if (pkg > 0 && price > 0) {
      return { ...r, cost: amount * (price / pkg), estimated: false };
    }
    const perKg = findPricePerKg(r.name, priceMap);
    const cost = estimateCost(amount, perKg);
    return { ...r, cost, estimated: cost > 0 };
  });

  const total = costed.reduce((s, r) => s + r.cost, 0);
  const perServing = sv > 0 ? total / sv : 0;
  const estimatedCount = costed.filter((r) => r.estimated).length;

  usePublishToolFacts("recipe-cost-calculator", {
    servings: { label: "Servings", value: fmt(sv, 0) },
    total: { label: "Total cost", value: `${currency}${fmt(total, 2)}` },
    perServing: { label: "Cost per serving", value: `${currency}${fmt(perServing, 2)}` },
    estCount: { label: "Estimated rows", value: String(estimatedCount) },
    rowCount: { label: "Ingredients", value: String(rows.length) }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <ExampleHelper
          hint="Price a spaghetti bolognese for 4 people — ingredient costs included."
          onExample={loadExample}
        />
        <Field label="Servings the recipe makes">
          <NumberInput value={servings} onChange={setServings} min={1} />
        </Field>
        <div className="overflow-x-auto rounded-lg border border-ink-200">
          <div className="grid grid-cols-[1.2fr_70px_80px_90px_auto] gap-2 border-b border-ink-200 bg-ink-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
            <span>Ingredient</span>
            <span>Amount</span>
            <span>Price</span>
            <span>Package size</span>
            <span />
          </div>
          {rows.map((row, i) => {
            const estimated = costed[i]?.estimated ?? false;
            return (
              <div
                key={i}
                className="grid grid-cols-[1.2fr_70px_80px_90px_auto] items-center gap-2 border-b border-ink-100 p-2 last:border-0"
              >
                <input
                  className={inputCls}
                  value={row.name}
                  placeholder="Ingredient"
                  onChange={(e) => update(i, { name: e.target.value })}
                />
                <NumberInput value={row.amount} onChange={(v) => update(i, { amount: v })} />
                <div className="relative">
                  <NumberInput
                    value={row.price}
                    onChange={(v) => update(i, { price: v })}
                    placeholder="auto"
                  />
                  {estimated && !loading && (
                    <span
                      title={`Estimated from the average supermarket price for ${row.name}`}
                      className="absolute -right-1 -top-1 rounded-full bg-copper-500 px-1.5 py-0.5 text-[9px] font-bold text-white"
                    >
                      est.
                    </span>
                  )}
                </div>
                <NumberInput
                  value={row.packageSize}
                  onChange={(v) => update(i, { packageSize: v })}
                />
                <RemoveButton onRemove={() => setRows((r) => r.filter((_, idx) => idx !== i))} />
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <AddRowButton
            onClick={() =>
              setRows((r) => [...r, { name: "", amount: "100", price: "", packageSize: "100" }])
            }
          >
            Add ingredient
          </AddRowButton>
          <ResetButton onReset={() => setRows([])} />
        </div>
        <p className="text-xs text-ink-400">
          Use the same unit for amount and package size (grams, ml or pieces). Leave the{" "}
          price blank to use the average supermarket price for common foods — rows using an{" "}
          estimate get an <span className="font-semibold text-copper-600">est.</span> badge.
        </p>
      </div>

      <ResultCard title="Recipe cost">
        <ResultRow label="Total cost" value={`${currency}${fmt(total, 2)}`} strong />
        <ResultRow
          label="Cost per serving"
          value={`${currency}${fmt(perServing, 2)}`}
          sub={sv > 0 ? `for ${fmt(sv, 0)} servings` : undefined}
        />
        <ResultRow
          label="vs. takeout"
          value="~2-4× less"
          sub="typical home vs. restaurant comparison"
        />
        {estimatedCount > 0 && (
          <p className="mt-3 rounded-lg bg-copper-500/15 px-3 py-2 text-xs text-copper-100">
            {estimatedCount} of {rows.length} prices estimated from average supermarket
            rates — enter the real price to refine.
          </p>
        )}
      </ResultCard>
    </div>
  );
}
