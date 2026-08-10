"use client";

import { Minimize2 } from "lucide-react";
import { useCompactMode } from "@/lib/useCompactMode";
import { useFavorites } from "@/lib/useFavorites";

export default function CompactModeToggle({ compact = false }: { compact?: boolean }) {
  const { enabled, ready } = useCompactMode();
  const { settings, updateSettings } = useFavorites();

  if (!ready) return null;

  const handleToggle = () => {
    // Compact and Easy are opposites — only one can be on at a time. Turning
    // Compact on forces Easy off, and vice versa (see EasyModeToggle).
    updateSettings({ compactMode: !enabled, easyMode: !enabled ? false : settings.easyMode });
  };

  return (
    <button
      onClick={handleToggle}
      aria-pressed={enabled}
      aria-label={
        enabled ? "Compact mode is on — turn it off" : "Compact mode — denser layout, more tools per screen"
      }
      title={
        enabled
          ? "Compact mode is on. Smaller spacing and more tools per screen."
          : "Turn on compact mode: tighter spacing and more tools per screen."
      }
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition ${
        enabled
          ? "border-ink-900 bg-ink-900 text-white"
          : "border-ink-200 bg-white text-ink-600 hover:border-ink-400 hover:text-ink-900"
      }`}
    >
      <Minimize2 className="h-3.5 w-3.5" />
      {!compact && <span>Compact</span>}
      <span
        className={`h-1.5 w-1.5 rounded-full ${enabled ? "bg-brand-400" : "bg-ink-300"}`}
        aria-hidden
      />
    </button>
  );
}
