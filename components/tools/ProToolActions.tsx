"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, BookmarkPlus, Loader2, Check, Download, UserRound } from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";
import { useResultHistory, type SavedResultRow } from "@/lib/useResultHistory";
import { useLang } from "@/lib/useLang";
import { t } from "@/lib/i18n";

/**
 * Member actions shown inside tool widgets: "Save result" (result history,
 * synced to a free account) and "Export as PDF". Both are free for everyone
 * — the platform has no paid tiers. Saving still needs a free account so the
 * history can follow the visitor across devices; PDF export works for guests.
 */
export default function ProToolActions({
  toolSlug,
  toolName,
  rows
}: {
  toolSlug: string;
  toolName: string;
  rows: SavedResultRow[];
}) {
  const { lang } = useLang();
  const { auth } = useFavorites();
  const { saveResult } = useResultHistory();
  const [busy, setBusy] = useState<null | "save" | "pdf">(null);
  const [done, setDone] = useState<null | "save" | "pdf">(null);
  const [error, setError] = useState("");

  const hasRows = rows.length > 0;
  const signedIn = auth === "signedIn";

  const run = async (kind: "save" | "pdf", fn: () => Promise<void>) => {
    setError("");
    setBusy(kind);
    try {
      await fn();
      setDone(kind);
      setTimeout(() => setDone(null), 2200);
    } catch (e) {
      setError(e instanceof Error ? e.message : t(lang, "pro.genericError"));
    } finally {
      setBusy(null);
    }
  };

  const saveResultAction = () =>
    run("save", async () => {
      if (!hasRows) throw new Error(t(lang, "pro.enterFirst"));
      await saveResult({
        toolSlug,
        toolName,
        title: rows[0]?.label ? `${toolName} — ${rows[0].label} ${rows[0].value}` : toolName,
        rows
      });
    });

  const exportPdfAction = () =>
    run("pdf", async () => {
      if (!hasRows) throw new Error(t(lang, "pro.enterFirstPdf"));
      const res = await fetch("/api/tools/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolSlug,
          toolName,
          rows,
          generatedAt: new Date().toISOString()
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || t(lang, "pro.exportFailed"));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${toolSlug || "results"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

  const btnCls =
    "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:opacity-60";

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">
              {t(lang, "pro.saveExportTitle")}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              {t(lang, "pro.saveExportCopy")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {signedIn ? (
            <button
              onClick={saveResultAction}
              disabled={busy !== null || !hasRows}
              className={`${btnCls} ${
                done === "save"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "border border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {busy === "save" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : done === "save" ? (
                <Check className="h-4 w-4" />
              ) : (
                <BookmarkPlus className="h-4 w-4" />
              )}
              {done === "save" ? t(lang, "pro.saved") : t(lang, "pro.saveResult")}
            </button>
          ) : (
            <Link
              href="/favorites"
              className="inline-flex items-center gap-2 rounded-md border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              <UserRound className="h-4 w-4" />
              {t(lang, "pro.signInSave")}
            </Link>
          )}
          <button
            onClick={exportPdfAction}
            disabled={busy !== null || !hasRows}
            className={`${btnCls} ${
              done === "pdf"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {busy === "pdf" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {busy === "pdf" ? t(lang, "pro.generatingPdf") : t(lang, "pro.exportPdf")}
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
