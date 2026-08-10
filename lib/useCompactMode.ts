"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "cookchase_compact_mode";

// Module-level shared state so every CompactModeToggle instance stays in sync
// within the same tab (not just across tabs).
let current = false;
const listeners = new Set<() => void>();

function readStored(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function writeStored(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    /* private mode */
  }
}

function applyDom(on: boolean) {
  document.documentElement.classList.toggle("compact-mode", on);
}

function notify() {
  listeners.forEach((l) => l());
}

/**
 * Apply Compact Mode from the synced account settings (or device storage on
 * load). Keeps the module state, the DOM class and the legacy localStorage
 * key in agreement so the header toggle and the pre-paint inline script both
 * see the same value. Safe to call before hydration / on the server.
 */
export function applyCompactModeFromAccount(on: boolean) {
  if (typeof document === "undefined") return; // SSR guard
  if (on) {
    // Compact and Easy are opposites. If a stale account/localStorage row ever
    // holds both flags, turning Compact on force-clears Easy so the two CSS
    // modes can never stack on <html> together.
    try {
      localStorage.setItem("cookchase_easy_mode", "0");
    } catch {
      /* private mode */
    }
    document.documentElement.classList.remove("easy-mode");
  }
  current = on;
  writeStored(on);
  applyDom(on);
  notify();
}

export function useCompactMode() {
  const [enabled, setEnabled] = useState(current);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    current = readStored();
    applyDom(current);
    setEnabled(current);
    setReady(true);

    const onChange = () => {
      current = readStored();
      setEnabled(current);
    };
    listeners.add(onChange);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        current = e.newValue === "1";
        setEnabled(current);
        applyDom(current);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggle = useCallback(() => {
    current = !current;
    setEnabled(current);
    writeStored(current);
    applyDom(current);
    notify();
  }, []);

  return { enabled, ready, toggle };
}
