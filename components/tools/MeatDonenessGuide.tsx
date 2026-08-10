"use client";

import { useState } from "react";
import { Field, selectCls, ResultCard, ResultRow, ExampleHelper, fmt, getToolExample, exStr } from "./ui";
import { Thermometer, Flame, Snowflake, Info } from "lucide-react";
import { MEATS, TEMP_MIN, TEMP_MAX, thermometerPercent, pullTemp } from "./meatDonenessMath";
import { useFavorites } from "@/lib/useFavorites";
import { usePublishToolFacts } from "./faqStore";

export default function MeatDonenessWidget() {
  const { settings } = useFavorites();
  // Metric users read °C first; imperial users read °F first.
  const metric = settings.units !== "imperial";
  const [meatId, setMeatId] = useState("beef-steak");
  const [donenessId, setDonenessId] = useState("med-rare");

  const loadExample = () => {
    const v = getToolExample("meat-doneness-guide").values;
    setMeatId(exStr(v, "meatId", "beef-steak"));
    setDonenessId(exStr(v, "donenessId", "med-rare"));
  };

  const meat = MEATS.find((m) => m.id === meatId)!;
  const level =
    meat.doneness.find((d) => d.id === donenessId) ?? meat.doneness[0];
  const pct = thermometerPercent(level.tempF);

  const primaryTemp = metric
    ? { big: `${level.tempC}°C`, sub: `${level.tempF}°F` }
    : { big: `${level.tempF}°F`, sub: `${level.tempC}°C` };

  usePublishToolFacts("meat-doneness-guide", {
    meat: { label: "Meat", value: meat.label },
    doneness: { label: "Doneness", value: level.label },
    tempF: { label: "Target (F)", value: `${level.tempF}°F` },
    tempC: { label: "Target (C)", value: `${level.tempC}°C` },
    safeMinF: { label: "USDA safe minimum", value: `${meat.safeMinF}°F` },
    rest: { label: "Rest time", value: meat.restMin }
  });

  return (
    <div className="space-y-6">
      <ExampleHelper
        hint="Check the target temperature for a medium-rare steak — 135°F / 57°C."
        onExample={loadExample}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Meat">
          <select
            className={selectCls}
            value={meatId}
            onChange={(e) => {
              setMeatId(e.target.value);
              const m = MEATS.find((x) => x.id === e.target.value)!;
              setDonenessId(m.doneness[0].id);
            }}
          >
            {MEATS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Doneness / target">
          <select
            className={selectCls}
            value={donenessId}
            onChange={(e) => setDonenessId(e.target.value)}
          >
            {meat.doneness.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label} — {d.tempF}°F / {d.tempC}°C
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Thermometer visual */}
      <div className="rounded-xl border border-ink-200 bg-white p-5">
        <div className="flex items-end gap-4">
          <div className="relative h-44 w-10 shrink-0 overflow-hidden rounded-full border-2 border-ink-200 bg-gradient-to-t from-sky-100 via-amber-100 to-red-100">
            <div
              className="absolute inset-x-0 bottom-0 bg-brand-500/70"
              style={{ height: `${pct}%` }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Target internal temperature
            </p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight text-ink-900">
              {primaryTemp.big}
            </p>
            <p className="text-lg font-semibold text-brand-600">{primaryTemp.sub}</p>
            <p className="mt-1 text-sm text-ink-500">{level.desc}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
          <span>{TEMP_MIN}°F</span>
          <span className="text-ink-500">Rare → Medium → Well</span>
          <span>{TEMP_MAX}°F</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ResultCard title="Safety minimum">
          <ResultRow
            label="USDA safe minimum"
            value={`${meat.safeMinF}°F`}
            sub={`${meat.safeMinC}°C`}
          />
        </ResultCard>
        <ResultCard title="Resting time">
          <ResultRow label="Rest before carving" value={meat.restMin} sub="Juices redistribute" />
        </ResultCard>
        <ResultCard title="Pro tip">
          <div className="flex items-start gap-2 text-xs text-brand-100">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-copper-300" />
            <span>{meat.note}</span>
          </div>
        </ResultCard>
      </div>

      {/* All doneness levels for this meat */}
      <div className="grid gap-2 sm:grid-cols-2">
        {meat.doneness.map((d) => (
          <button
            key={d.id}
            onClick={() => setDonenessId(d.id)}
            className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition ${
              d.id === donenessId
                ? "border-brand-500 bg-brand-50"
                : "border-ink-200 bg-white hover:border-brand-300"
            }`}
          >
            <span>
              <span className={`block text-sm font-semibold ${d.id === donenessId ? "text-brand-700" : "text-ink-800"}`}>
                {d.label}
              </span>
              <span className="block text-xs text-ink-500">{d.desc}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-bold text-ink-900">
                {metric ? `${d.tempC}°C` : `${d.tempF}°F`}
              </span>
              <span className="block text-xs text-ink-400">
                {metric ? `${d.tempF}°F` : `${d.tempC}°C`}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-200 bg-white p-4 text-xs text-ink-500">
        <span className="flex items-center gap-1.5">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          Pull meat 5°F below target — carryover cooking adds heat during rest.
        </span>
        <span className="flex items-center gap-1.5">
          <Snowflake className="h-3.5 w-3.5 text-sky-500" />
          Insert probe in the thickest part, away from bone and fat.
        </span>
        <span className="flex items-center gap-1.5">
          <Thermometer className="h-3.5 w-3.5 text-brand-500" />
          {fmt(pullTemp(level.tempF), 0)}°F pull temperature recommended.
        </span>
      </div>
    </div>
  );
}
