"use client";

import { useSyncExternalStore } from "react";
import type { ToolExampleConfig } from "@/lib/tool-examples";
import { buildExampleVariant } from "@/lib/example-variants";

/** String value from an example config, with a fallback for blank/missing. */
export function exStr(v: Record<string, unknown>, key: string, fallback: string): string {
  const val = v[key];
  return typeof val === "string" || typeof val === "number" ? String(val) : fallback;
}

/** Numeric value from an example config, with a fallback for blank/missing. */
export function exNum(v: Record<string, unknown>, key: string, fallback: number): number {
  const val = v[key];
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string" && val.trim() !== "" && !Number.isNaN(Number(val))) {
    return Number(val);
  }
  return fallback;
}

/** Array value from an example config (rows/timers…), with a fallback. */
export function exArr<T>(v: Record<string, unknown>, key: string, fallback: T[]): T[] {
  const val = v[key];
  return Array.isArray(val) && val.length > 0 ? (val as T[]) : fallback;
}

/**
 * Shared "tool example" store.
 *
 * The tool page (server) reads tools.example_hint / tools.example_values from
 * the database and renders an <ExampleBridge> next to the widget. The bridge
 * publishes that config here, and every widget's loadExample() reads it back
 * via getToolExample() when the visitor presses "Try an example" — so the
 * admin's edits to the hint and the values take effect without touching code.
 *
 * When the store has nothing for a slug (admin-created tools, or a first paint
 * before the bridge mounts), widgets fall back to the values they hardcoded —
 * exactly the behaviour the site had before this feature.
 */

const examplesBySlug: Record<string, ToolExampleConfig> = {};
const listeners = new Set<() => void>();

function emit() {
  for (const fn of Array.from(listeners)) fn();
}

export function publishToolExample(slug: string, config: ToolExampleConfig) {
  examplesBySlug[slug] = config;
  emit();
}

// Press counter per slug — the seed handed to the variant builder. Each press
// advances it, so the button fills a DIFFERENT example every time, but the
// sequence stays deterministic: press #3 of water-intake always fills the same
// values as a previous press #3. Reproducible, not chaotic.
const pressCounts: Record<string, number> = {};

/**
 * Non-hook getter — safe to call from event handlers like loadExample().
 *
 * Returns the admin's hint plus a FRESH SEEDED VARIANT of the values on every
 * call: the same tool fills different servings / proteins / amounts on each
 * press, while staying inside the widget's valid option set.
 */
export function getToolExample(slug: string): ToolExampleConfig {
  const base = examplesBySlug[slug] ?? { hint: "", values: {} };
  const press = (pressCounts[slug] = (pressCounts[slug] ?? 0) + 1);
  return {
    hint: base.hint,
    values: buildExampleVariant(slug, base.values, press)
  };
}

/** Stable empty snapshot for server rendering (no hydration mismatch). */
const EMPTY: ToolExampleConfig = { hint: "", values: {} };

/** Reactive read — used by ExampleHelper so the admin hint wins over the
 *  widget's built-in hint once the bridge publishes it. */
export function useToolExample(slug: string): ToolExampleConfig {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => examplesBySlug[slug] || EMPTY,
    () => EMPTY
  );
}
