"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * Shared "tool facts" store.
 *
 * Every tool widget publishes its CURRENT inputs + key results as facts
 * ({ key: { label, value } }) via usePublishToolFacts. The DynamicFAQ
 * component on the same page reads them back via useToolFacts and builds
 * FAQ answers that speak in terms of the exact values the visitor entered —
 * e.g. "With 4 servings, each serving is 350 kcal".
 *
 * The store is module-level (like lib/useFavorites) so the widget and the
 * FAQ share state without prop drilling or context, and the FAQ updates
 * live as the visitor changes the inputs.
 */

export interface ToolFact {
  label: string;
  value: string;
}

export type ToolFacts = Record<string, ToolFact>;

const factsBySlug: Record<string, ToolFacts> = {};
const listeners = new Set<() => void>();

function emit() {
  for (const fn of Array.from(listeners)) fn();
}

function shallowEqual(a: ToolFacts | undefined, b: ToolFacts): boolean {
  if (!a) return false;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of Array.from(keys)) {
    if (a[k]?.value !== b[k]?.value) return false;
  }
  return true;
}

export function publishToolFacts(slug: string, facts: ToolFacts) {
  if (shallowEqual(factsBySlug[slug], facts)) return;
  factsBySlug[slug] = facts;
  emit();
}

export function clearToolFacts(slug: string) {
  if (!factsBySlug[slug]) return;
  delete factsBySlug[slug];
  emit();
}

/** Stable empty snapshot for server rendering (no hydration mismatch). */
const EMPTY: ToolFacts = {};

export function useToolFacts(slug: string): ToolFacts {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => factsBySlug[slug] || EMPTY,
    () => EMPTY
  );
}

/**
 * Publish the current facts for a tool on every render. `publishToolFacts`
 * shallow-compares before emitting, so unchanged values don't cause extra
 * renders. The facts are cleared when the widget unmounts so a later visit
 * to the same slug starts fresh.
 */
export function usePublishToolFacts(slug: string, facts: ToolFacts) {
  const ref = useRef(facts);
  ref.current = facts;

  // Deliberately NO dependency array: this runs after every render so the
  // store always mirrors the latest widget state. publishToolFacts()
  // shallow-compares before emitting, so unchanged values cost nothing.
  useEffect(() => {
    publishToolFacts(slug, ref.current);
  });

  useEffect(() => {
    return () => clearToolFacts(slug);
  }, [slug]);
}
