"use client";

import { useEffect, useState } from "react";

// Real kitchen conversions — the scale weighs each one in turn.
const READINGS: { input: string; value: string; unit: string }[] = [
  { input: "1 cup all-purpose flour", value: "125", unit: "g" },
  { input: "350°F oven", value: "177", unit: "°C" },
  { input: "1.5 kg whole chicken", value: "60–75", unit: "min" },
  { input: "4 → 8 servings", value: "2×", unit: "batch" },
  { input: "500 g dough @ 72%", value: "360", unit: "ml water" },
  { input: "1 tbsp honey", value: "21", unit: "g" }
];

export default function ScaleDemo() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % READINGS.length), 2600);
    return () => clearInterval(id);
  }, [paused]);

  const r = READINGS[index];

  return (
    <div
      role="img"
      aria-label={`Example calculation: ${r.input} equals ${r.value} ${r.unit}`}
      className="readout-panel w-full max-w-sm rounded-3xl p-6 sm:p-7"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-between">
        <span className="eyebrow text-copper-300">Scale · tared</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-copper-400" />
          <span className="eyebrow text-brand-200/70">live</span>
        </span>
      </div>

      <div key={index} className="animate-weigh-in mt-6">
        <div className="text-sm text-brand-200/80">{r.input}</div>
        <div className="mt-2 flex items-end gap-2">
          <span className="readout text-5xl font-bold leading-none text-copper-200">
            {r.value}
          </span>
          <span className="readout pb-1 text-lg text-brand-200/90">{r.unit}</span>
        </div>
      </div>

      <div className="mt-6 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between text-[11px] text-brand-200/60">
          <span>cookchase.com</span>
          <span className="readout">{String(index + 1).padStart(2, "0")}/{READINGS.length}</span>
        </div>
        {/* tick marks like a measuring tool */}
        <div aria-hidden="true" className="mt-2 flex justify-between text-[10px] text-brand-200/50">
          {["cup", "g", "°C", "min", "×", "tbsp"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
