"use client";

import { useState } from "react";
import { usePublishToolFacts } from "./faqStore";
import { Field, NumberInput, selectCls, ResultCard, ResultRow, ExampleHelper, fmt, getToolExample } from "./ui";

interface Pan {
  shape: string;
  d: string;
  w: string;
  l: string;
  unit: "in" | "cm";
}

function area(p: Pan): number {
  const shape = p.shape;
  const unitFactor = p.unit === "cm" ? 1 : 2.54; // normalize to cm²
  if (shape === "round") {
    const d = (parseFloat(p.d) || 0) * unitFactor;
    return Math.PI * (d / 2) ** 2;
  }
  const w = (parseFloat(p.w) || 0) * unitFactor;
  const l = (parseFloat(p.l) || 0) * unitFactor;
  if (shape === "square") return w * w;
  if (shape === "loaf") return w * l * 0.7;
  return w * l;
}

const defaults: Record<string, Partial<Pan>> = {
  round: { d: "9" },
  square: { w: "8" },
  rectangle: { w: "9", l: "13" },
  loaf: { w: "4", l: "8" }
};

export default function BakingPanConverterWidget() {
  const [orig, setOrig] = useState<Pan>({ shape: "round", d: "9", w: "", l: "", unit: "in" });
  const [target, setTarget] = useState<Pan>({ shape: "square", d: "", w: "8", l: "", unit: "in" });

  const loadExample = () => {
    const v = getToolExample("baking-pan-converter").values;
    const o = v.orig as Pan | undefined;
    const t = v.target as Pan | undefined;
    setOrig(o ?? { shape: "round", d: "9", w: "", l: "", unit: "in" });
    setTarget(t ?? { shape: "rectangle", d: "", w: "9", l: "13", unit: "in" });
  };

  const setShape = (side: "orig" | "target", shape: string) => {
    const patch = defaults[shape] || {};
    const updater = side === "orig" ? setOrig : setTarget;
    updater((p) => ({ ...p, shape, d: patch.d ?? "", w: patch.w ?? "", l: patch.l ?? "" }));
  };

  const a1 = area(orig);
  const a2 = area(target);
  const factor = a1 > 0 ? a2 / a1 : 0;

  const panDesc = (p: Pan) =>
    p.shape === "round"
      ? `${p.d || "?"} ${p.unit} round`
      : p.shape === "square"
        ? `${p.w || "?"} ${p.unit} square`
        : `${p.w || "?"}×${p.l || "?"} ${p.unit} ${p.shape}`;

  usePublishToolFacts("baking-pan-converter", {
    origPan: { label: "Original pan", value: panDesc(orig) },
    targetPan: { label: "New pan", value: panDesc(target) },
    factor: { label: "Multiplier", value: `${fmt(factor, 2)}×` },
    origArea: { label: "Original area", value: `${fmt(a1, 0)} cm²` },
    targetArea: { label: "New area", value: `${fmt(a2, 0)} cm²` }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <ExampleHelper
          hint="Switch a 9-inch round cake recipe to a 9×13 rectangle pan."
          onExample={loadExample}
        />
        {(["orig", "target"] as const).map((side) => {
          const p = side === "orig" ? orig : target;
          const set = side === "orig" ? setOrig : setTarget;
          return (
            <div key={side} className="rounded-lg border border-ink-200 p-4">
              <p className="mb-3 text-sm font-semibold text-ink-800">
                {side === "orig" ? "Original pan" : "Pan you want to use"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Shape">
                  <select
                    className={selectCls}
                    value={p.shape}
                    onChange={(e) => setShape(side, e.target.value)}
                  >
                    <option value="round">Round</option>
                    <option value="square">Square</option>
                    <option value="rectangle">Rectangle</option>
                    <option value="loaf">Loaf</option>
                  </select>
                </Field>
                <Field label="Unit">
                  <select
                    className={selectCls}
                    value={p.unit}
                    onChange={(e) => set({ ...p, unit: e.target.value as "in" | "cm" })}
                  >
                    <option value="in">inches</option>
                    <option value="cm">cm</option>
                  </select>
                </Field>
                {p.shape === "round" && (
                  <Field label="Diameter">
                    <NumberInput
                      value={p.d}
                      onChange={(v) => set({ ...p, d: v })}
                      placeholder="9"
                    />
                  </Field>
                )}
                {p.shape === "square" && (
                  <Field label="Side length">
                    <NumberInput
                      value={p.w}
                      onChange={(v) => set({ ...p, w: v })}
                      placeholder="8"
                    />
                  </Field>
                )}
                {(p.shape === "rectangle" || p.shape === "loaf") && (
                  <>
                    <Field label="Width">
                      <NumberInput
                        value={p.w}
                        onChange={(v) => set({ ...p, w: v })}
                        placeholder="9"
                      />
                    </Field>
                    <Field label="Length">
                      <NumberInput
                        value={p.l}
                        onChange={(v) => set({ ...p, l: v })}
                        placeholder="13"
                      />
                    </Field>
                  </>
                )}
              </div>
            </div>
          );
        })}

      </div>

      <ResultCard title="Pan conversion">
        <ResultRow
          label="Ingredient multiplier"
          value={`${fmt(factor, 2)}×`}
          sub="multiply every ingredient by this"
          strong
        />
        <ResultRow label="Original pan area" value={`${fmt(a1, 0)} cm²`} />
        <ResultRow label="New pan area" value={`${fmt(a2, 0)} cm²`} />
        <p className="mt-3 rounded-lg border border-white/10 bg-white/10 p-3 text-xs leading-relaxed text-brand-100">
          {factor >= 1.2
            ? "Bigger pan → batter is shallower: start checking doneness 10–15 minutes early."
            : factor <= 0.8
              ? "Smaller pan → batter is deeper: reduce oven 25°F and add 15–20% time."
              : "Sizes are close — keep the original temperature and check at the recipe time."}
        </p>
      </ResultCard>
    </div>
  );
}
