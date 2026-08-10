"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePublishToolFacts } from "./faqStore";
import { Field, NumberInput, ResultCard, ResetButton, ExampleHelper, useNumber, getToolExample, exStr } from "./ui";

const styles: { id: string; label: string; mins: number; desc: string }[] = [
  { id: "soft", label: "Soft-boiled", mins: 6, desc: "Runny yolk, set white — perfect for soldiers or ramen." },
  { id: "medium", label: "Medium-boiled", mins: 8, desc: "Jammy, custard-like yolk — great for salads and toast." },
  { id: "hard", label: "Hard-boiled", mins: 11, desc: "Fully set yolk — ideal for sandwiches and egg salad." }
];

function fmtTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function EggTimer() {
  const [styleId, setStyleId] = useState("soft");
  const [altitude, setAltitude] = useState("0");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const endRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const loadExample = () => {
    const v = getToolExample("egg-timer").values;
    cancelLoop();
    endRef.current = null;
    setStyleId(exStr(v, "styleId", "medium"));
    setAltitude(exStr(v, "altitude", "0"));
    setRunning(false);
    setRemaining(null);
  };

  const style = styles.find((s) => s.id === styleId) ?? styles[0];
  const baseMins = style.mins;
  const alt = useNumber(altitude);
  const adjusted = baseMins + (alt >= 3000 ? 1 : 0) + (alt >= 6000 ? 1 : 0) + (alt >= 9000 ? 1 : 0);

  const cancelLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (endRef.current === null) {
      setRunning(false);
      return;
    }
    const left = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
    setRemaining(left);
    if (left <= 0) {
      setRunning(false);
      endRef.current = null;
      rafRef.current = null;
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = () => {
    cancelLoop();
    endRef.current = Date.now() + adjusted * 60000;
    setRemaining(adjusted * 60);
    setRunning(true);
  };
  const stop = () => {
    cancelLoop();
    endRef.current = null;
    setRunning(false);
    setRemaining(null);
  };

  useEffect(() => {
    if (running) rafRef.current = requestAnimationFrame(tick);
    return cancelLoop;
  }, [running, tick, cancelLoop]);

  const selectStyle = (id: string) => {
    cancelLoop();
    endRef.current = null;
    setStyleId(id);
    setRunning(false);
    setRemaining(null);
  };

  usePublishToolFacts("egg-timer", {
    style: { label: "Style", value: style.label.toLowerCase() },
    minutes: { label: "Boil time", value: `${adjusted} min` },
    altitude: { label: "Elevation", value: alt ? `${alt} m` : "0" }
  });

  const done = remaining === 0;

  return (
    <div className="space-y-5">
      <ExampleHelper
        hint="Set a jammy medium-boiled egg — 8 minutes at sea level."
        onExample={loadExample}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {styles.map((s) => (
          <button
            key={s.id}
            onClick={() => selectStyle(s.id)}
            className={`rounded-xl border p-4 text-left transition ${
              styleId === s.id
                ? "border-brand-400 bg-brand-50 shadow-sm"
                : "border-ink-200 bg-white hover:border-ink-300"
            }`}
          >
            <span className="block text-sm font-semibold text-ink-900">{s.label}</span>
            <span className="mt-1 block text-2xl font-bold text-brand-600">{s.mins} min</span>
            <span className="mt-1 block text-xs leading-snug text-ink-500">{s.desc}</span>
          </button>
        ))}
      </div>

      <Field label="Elevation (m)" hint="Boiling point drops with altitude, so eggs need extra time.">
        <NumberInput value={altitude} onChange={setAltitude} min={0} placeholder="e.g. 0" />
      </Field>

      {alt >= 3000 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Adjusted time: <strong>{adjusted} min</strong> for {style.label.toLowerCase()} at your altitude.
        </p>
      )}

      <ResultCard title="Your egg timer">
        <div className="text-center">
          <div
            className={`readout text-5xl font-bold tracking-tight ${
              done ? "text-green-400" : "text-white"
            }`}
          >
            {remaining === null ? fmtTime(adjusted * 60) : fmtTime(remaining)}
          </div>
          <p className="mt-2 text-sm text-brand-100/90">
            {done
              ? "Done! Ice-bath the eggs for 30 seconds to stop the cooking."
              : running
                ? "Timing your eggs… start counting from boiling water, not cold."
                : `${style.label} needs ${adjusted} min from the moment the water boils.`}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {running ? (
              <button
                onClick={stop}
                className="rounded-md bg-white/15 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/25"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={start}
                className="rounded-md bg-copper-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-copper-600"
              >
                {remaining === null ? "Start timer" : "Restart"}
              </button>
            )}
          </div>
        </div>
      </ResultCard>

      <p className="text-xs leading-relaxed text-ink-500">
        For perfectly peeled eggs, drop them straight from boiling water into an ice bath for 30
        seconds, then tap and roll gently. Fresher eggs are harder to peel — a pinch of baking soda
        in the water helps.
      </p>
    </div>
  );
}
