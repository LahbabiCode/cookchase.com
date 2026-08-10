"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "cookchase_easy_mode";
// Dark high-contrast is a sub-option of Easy Mode: it only has visual effect
// while easy-mode is on (CSS gates on html.easy-mode.easy-contrast). Turning
// Easy off clears it too — the flag is meaningless without Easy Mode, and the
// header/account toggles reset it at the same time they switch Easy off.
const CONTRAST_KEY = "cookchase_easy_contrast";

// Module-level shared state so every EasyModeToggle / VoiceGuide instance
// stays in sync within the same tab (not just across tabs).
let current = false;
let contrastCurrent = false;
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

function readStoredContrast(): boolean {
  try {
    return localStorage.getItem(CONTRAST_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredContrast(on: boolean) {
  try {
    localStorage.setItem(CONTRAST_KEY, on ? "1" : "0");
  } catch {
    /* private mode */
  }
}

function applyDom(on: boolean) {
  document.documentElement.classList.toggle("easy-mode", on);
}

function applyDomContrast(on: boolean) {
  document.documentElement.classList.toggle("easy-contrast", on);
}

function notify() {
  listeners.forEach((l) => l());
}

/**
 * Apply Easy Mode from the synced account settings (or device storage on
 * load). Keeps the module state, the DOM class and the legacy localStorage
 * key in agreement so the header toggle and the pre-paint inline script both
 * see the same value. Safe to call before hydration / on the server.
 *
 * Turning Easy off also clears the high-contrast class and flag: the
 * sub-option is meaningless without Easy Mode, and clearing it here keeps
 * the DOM and the stored preference consistent.
 */
export function applyEasyModeFromAccount(on: boolean) {
  if (typeof document === "undefined") return; // SSR guard
  if (on) {
    // Easy and Compact are opposites. If a stale account/localStorage row ever
    // holds both flags, turning Easy on force-clears Compact so the two CSS
    // modes can never stack on <html> together.
    try {
      localStorage.setItem("cookchase_compact_mode", "0");
    } catch {
      /* private mode */
    }
    document.documentElement.classList.remove("compact-mode");
  } else {
    // High-contrast only makes sense while Easy Mode is on.
    contrastCurrent = false;
    writeStoredContrast(false);
    applyDomContrast(false);
  }
  current = on;
  writeStored(on);
  applyDom(on);
  notify();
}

/**
 * Apply the dark high-contrast sub-option. Stored separately from Easy Mode
 * itself, but the CSS only responds when both classes are on <html>, and the
 * guard below makes it impossible to turn the flag on while Easy Mode is off.
 */
export function applyEasyContrastFromAccount(on: boolean) {
  if (typeof document === "undefined") return; // SSR guard
  // The sub-option can never be on while Easy Mode is off.
  if (on && !current) return;
  contrastCurrent = on;
  writeStoredContrast(on);
  applyDomContrast(on);
  notify();
}

export function useEasyMode() {
  const [enabled, setEnabled] = useState(current);
  const [contrast, setContrast] = useState(contrastCurrent);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    current = readStored();
    applyDom(current);
    contrastCurrent = readStoredContrast();
    applyDomContrast(contrastCurrent);
    setEnabled(current);
    setContrast(contrastCurrent);
    setReady(true);

    const onChange = () => {
      current = readStored();
      contrastCurrent = readStoredContrast();
      setEnabled(current);
      setContrast(contrastCurrent);
    };
    listeners.add(onChange);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        current = e.newValue === "1";
        setEnabled(current);
        applyDom(current);
      }
      if (e.key === CONTRAST_KEY) {
        contrastCurrent = e.newValue === "1";
        setContrast(contrastCurrent);
        applyDomContrast(contrastCurrent);
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

  return { enabled, contrast, ready, toggle };
}
