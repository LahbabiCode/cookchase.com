"use client";

import { Accessibility, Contrast } from "lucide-react";
import { useEasyMode } from "@/lib/useEasyMode";
import { useFavorites } from "@/lib/useFavorites";

export default function EasyModeToggle({ compact = false }: { compact?: boolean }) {
  const { enabled, contrast, ready } = useEasyMode();
  const { settings, updateSettings } = useFavorites();

  if (!ready) return null;

  const handleToggle = () => {
    // updateSettings is the single writer: it updates the store, calls
    // applyEasyModeFromAccount (module state + DOM class + legacy key + notify)
    // and persists to the account when signed in. No separate toggle() needed.
    // Easy and Compact are opposites — turning Easy on forces Compact off.
    // Turning Easy off also clears the high-contrast sub-option (it only
    // makes sense while Easy Mode is on).
    updateSettings({
      easyMode: !enabled,
      compactMode: !enabled ? false : settings.compactMode,
      easyContrast: !enabled ? false : settings.easyContrast
    });
  };

  const handleContrast = () => {
    // High-contrast is a sub-option of Easy Mode — the button is only shown
    // while Easy is on, so the flag is always toggled with easyMode already
    // true. applyEasyContrastFromAccount handles the DOM class + storage.
    updateSettings({ easyContrast: !contrast });
  };

  return (
    <>
      <button
        onClick={handleToggle}
        aria-pressed={enabled}
        aria-label={
          enabled ? "Easy mode is on — turn it off" : "Easy mode — bigger text, clearer colors"
        }
        title={
          enabled
            ? "Easy mode is on. Bigger text, higher contrast, read-aloud help."
            : "Turn on easy mode: bigger text, higher contrast and read-aloud help."
        }
        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition ${
          enabled
            ? "border-brand-400 bg-brand-50 text-brand-700"
            : "border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-600"
        }`}
      >
        <Accessibility className="h-3.5 w-3.5" />
        {!compact && <span>Easy mode</span>}
        <span
          className={`h-1.5 w-1.5 rounded-full ${enabled ? "bg-brand-500" : "bg-ink-300"}`}
          aria-hidden
        />
      </button>

      {enabled && (
        <button
          onClick={handleContrast}
          aria-pressed={contrast}
          aria-label={
            contrast
              ? "Dark high contrast is on — turn it off"
              : "Dark high contrast — black background, white text, clear borders"
          }
          title={
            contrast
              ? "Dark high contrast is on. Black background, bright white text and clearly outlined cards."
              : "Turn on dark high contrast: black background, bright white text and clearly outlined cards — the last resort for very low vision."
          }
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition ${
            contrast
              ? "border-white bg-ink-900 text-white"
              : "border-ink-200 bg-white text-ink-600 hover:border-ink-900 hover:text-ink-900"
          }`}
        >
          <Contrast className="h-3.5 w-3.5" />
          {!compact && <span>High contrast</span>}
          <span
            className={`h-1.5 w-1.5 rounded-full ${contrast ? "bg-white" : "bg-ink-300"}`}
            aria-hidden
          />
        </button>
      )}
    </>
  );
}
