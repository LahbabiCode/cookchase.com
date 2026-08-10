"use client";

import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { feedbackStorageKey } from "@/lib/guide-feedback";
import { useLang } from "@/lib/useLang";

/**
 * "Was this guide helpful?" — a two-button widget rendered under every tool's
 * Quick guide. Each visitor votes once per tool (guarded by localStorage),
 * the vote is stored server-side, and the admin panel aggregates the answers
 * to spot the guides that need a better explanation.
 *
 * The remembered vote is read in an effect (not the state initializer) so the
 * server HTML always shows the idle buttons — a returning visitor's saved
 * answer only appears after hydration, avoiding a hydration mismatch.
 */
export default function GuideFeedback({ slug }: { slug: string }) {
  const { t } = useLang();
  const [state, setState] = useState<"idle" | "yes" | "no">("idle");
  const [saving, setSaving] = useState(false);

  // Restore a previous vote after mount (localStorage is client-only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(feedbackStorageKey(slug));
      if (raw === "1") setState("yes");
      else if (raw === "0") setState("no");
    } catch {
      /* storage unavailable */
    }
  }, [slug]);

  const vote = (helpful: boolean) => {
    if (state !== "idle" || saving) return;
    setSaving(true);
    fetch("/api/guide-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, helpful })
    })
      .then((r) => r.json().catch(() => ({})))
      .then((json) => {
        // Record locally even if the request failed, so the visitor isn't
        // nagged again — the vote simply won't count.
        try {
          localStorage.setItem(feedbackStorageKey(slug), helpful ? "1" : "0");
        } catch {
          /* storage unavailable */
        }
        setState(helpful ? "yes" : "no");
        if (!json.ok) {
          console.warn("[guide-feedback] vote not saved:", json.error);
        }
      })
      .finally(() => setSaving(false));
  };

  if (state !== "idle") {
    return (
      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-ink-100 bg-ink-50/60 px-4 py-3 text-sm text-ink-600">
        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
        <span>
          {state === "yes" ? t("guide.thanksHelped") : t("guide.thanksClearer")}{" "}
          {state === "no" && t("guide.helpsImprove")}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 bg-ink-50/60 px-4 py-3">
      <p className="text-sm font-medium text-ink-700">{t("guide.wasHelpful")}</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => vote(true)}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          {t("guide.yes")}
        </button>
        <button
          onClick={() => vote(false)}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3.5 py-2 text-xs font-semibold text-ink-700 transition hover:border-red-300 hover:text-red-600 disabled:opacity-60"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
          {t("guide.needsWork")}
        </button>
      </div>
    </div>
  );
}
