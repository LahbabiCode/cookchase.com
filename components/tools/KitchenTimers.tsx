"use client";

import { useEffect, useState } from "react";
import { Play, Pause, Trash2, Plus, Bell } from "lucide-react";
import { useNow, formatDuration, inputCls, Field, ExampleHelper, getToolExample, exArr } from "./ui";
import { usePublishToolFacts } from "./faqStore";

interface Timer {
  id: number;
  name: string;
  duration: number; // seconds (target when running, remaining when paused)
  endAt: number | null;
  done: boolean;
}

let nextId = 1;

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    /* no audio */
  }
}

export default function KitchenTimersWidget() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [name, setName] = useState("");
  const [mins, setMins] = useState("");
  const [secs, setSecs] = useState("");
  const now = useNow(250);

  // Detect completion after a tick — never setState during render.
  useEffect(() => {
    let changed = false;
    const completed: Timer[] = [];
    for (const tm of timers) {
      if (tm.endAt && tm.endAt <= now && !tm.done) {
        completed.push(tm);
        changed = true;
      }
    }
    if (changed) {
      setTimers((t) =>
        t.map((x) =>
          completed.some((c) => c.id === x.id)
            ? { ...x, done: true, endAt: null }
            : x
        )
      );
      for (const c of completed) {
        setTimeout(() => beep(), 0);
      }
    }
  }, [timers, now]);

  const addTimer = () => {
    const total = (parseInt(mins) || 0) * 60 + (parseInt(secs) || 0);
    if (total <= 0) return;
    setTimers((t) => [
      ...t,
      {
        id: nextId++,
        name: name.trim() || `Timer ${t.length + 1}`,
        duration: total,
        endAt: Date.now() + total * 1000,
        done: false
      }
    ]);
    setName("");
    setMins("");
    setSecs("");
  };

  const pause = (id: number) => {
    setTimers((t) =>
      t.map((tm) => {
        if (tm.id !== id || !tm.endAt) return tm;
        const remaining = Math.max(0, Math.round((tm.endAt - now) / 1000));
        return { ...tm, duration: remaining, endAt: null };
      })
    );
  };

  const resume = (id: number) => {
    setTimers((t) =>
      t.map((tm) => {
        if (tm.id !== id || tm.endAt || tm.done) return tm;
        return { ...tm, endAt: Date.now() + tm.duration * 1000 };
      })
    );
  };

  const reset = (id: number) => {
    setTimers((t) =>
      t.map((tm) => (tm.id === id ? { ...tm, endAt: null, duration: tm.duration, done: false } : tm))
    );
  };

  const remove = (id: number) => setTimers((t) => t.filter((x) => x.id !== id));

  const loadExample = () => {
    const v = getToolExample("kitchen-timers").values;
    const presets = exArr<{ name: string; duration: number }>(v, "timers", [
      { name: "Pasta", duration: 600 },
      { name: "Roast chicken", duration: 2700 },
      { name: "Steamed broccoli", duration: 300 }
    ]);
    setTimers(
      presets.map((t) => ({
        id: nextId++,
        name: t.name,
        duration: t.duration,
        endAt: Date.now() + t.duration * 1000,
        done: false
      }))
    );
  };

  const activeCount = timers.filter((t) => t.endAt).length;

  usePublishToolFacts("kitchen-timers", {
    count: { label: "Timers", value: String(timers.length) },
    active: { label: "Running", value: String(activeCount) }
  });

  return (
    <div className="space-y-5">
      <ExampleHelper
        hint="Run pasta, roast chicken and broccoli timers all at once."
        onExample={loadExample}
      />
      <div className="rounded-lg border border-ink-200 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_100px_100px_auto] sm:items-end">
          <Field label="Name">
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pasta"
            />
          </Field>
          <Field label="Minutes">
            <input
              type="number"
              min={0}
              className={inputCls}
              value={mins}
              onChange={(e) => setMins(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Seconds">
            <input
              type="number"
              min={0}
              max={59}
              className={inputCls}
              value={secs}
              onChange={(e) => setSecs(e.target.value)}
              placeholder="0"
            />
          </Field>
          <button
            onClick={addTimer}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

      </div>

      {activeCount > 0 && (
        <p className="text-xs font-medium text-brand-600">
          {activeCount} timer{activeCount === 1 ? "" : "s"} running
        </p>
      )}

      {timers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-ink-200 py-12 text-center">
          <Bell className="h-8 w-8 text-ink-300" />
          <p className="text-sm text-ink-400">
            No timers yet — add one above to start juggling dishes.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {timers.map((tm) => {
            const remaining = tm.endAt
              ? Math.max(0, Math.round((tm.endAt - now) / 1000))
              : tm.duration;
            const pct = tm.duration > 0 ? (remaining / tm.duration) * 100 : 0;
            return (
              <div
                key={tm.id}
                className={`rounded-lg border p-4 ${
                  tm.done ? "border-green-200 bg-green-50/50" : "border-ink-200 bg-white shadow-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-ink-900">{tm.name}</h4>
                  <button
                    onClick={() => remove(tm.id)}
                    aria-label="Remove timer"
                    className="text-ink-300 transition hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p
                  className={`mt-1 font-mono text-3xl font-bold tabular-nums ${
                    tm.done ? "text-green-600" : "text-ink-900"
                  }`}
                >
                  {tm.done ? "Done!" : formatDuration(remaining)}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      tm.done ? "bg-green-500" : "bg-brand-600"
                    }`}
                    style={{ width: `${tm.done ? 100 : pct}%` }}
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  {tm.done ? (
                    <button
                      onClick={() => reset(tm.id)}
                      className="flex-1 rounded-md border border-green-200 bg-white px-2 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-50"
                    >
                      Reset
                    </button>
                  ) : tm.endAt ? (
                    <button
                      onClick={() => pause(tm.id)}
                      className="flex-1 rounded-md bg-ink-900 px-2 py-1.5 text-xs font-medium text-white transition hover:bg-ink-800"
                    >
                      <Pause className="mr-1 inline h-3 w-3" /> Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => resume(tm.id)}
                      className="flex-1 rounded-md bg-brand-600 px-2 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700"
                    >
                      <Play className="mr-1 inline h-3 w-3" /> Resume
                    </button>
                  )}
                  <button
                    onClick={() => reset(tm.id)}
                    className="rounded-md border border-ink-200 bg-white px-2 py-1.5 text-xs font-medium text-ink-500 transition hover:bg-ink-50"
                  >
                    Reset
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
