"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  ExternalLink,
  RefreshCw,
  FileText,
  FileCode2,
  Map,
  ScrollText,
  Gauge,
  Lock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Megaphone,
  Home,
  PartyPopper
} from "lucide-react";

interface CheckResult {
  id: string;
  label: string;
  what: string;
  why: string;
  state: "ok" | "warn" | "fail";
  detail: string;
}

interface AdSenseCheckResponse {
  checkedAt: string;
  base: string;
  siteUrl: string;
  ready: boolean;
  counts: { ok: number; warn: number; fail: number };
  checks: CheckResult[];
}

const CHECK_ICONS: Record<string, typeof FileText> = {
  https: Lock,
  homepage: Home,
  "ads.txt": Megaphone,
  "robots.txt": FileCode2,
  "sitemap.xml": Map,
  privacy: ScrollText,
  terms: FileText,
  "adsense-config": Megaphone,
  speed: Gauge
};

const STATE_STYLES: Record<
  CheckResult["state"],
  { badge: string; text: string; label: string }
> = {
  ok: {
    badge: "bg-green-50 text-green-700 border-green-200",
    text: "text-green-700",
    label: "Pass"
  },
  warn: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    text: "text-amber-700",
    label: "Check"
  },
  fail: {
    badge: "bg-red-50 text-red-600 border-red-200",
    text: "text-red-600",
    label: "Fix"
  }
};

export default function AdSenseReadyAdmin() {
  const [data, setData] = useState<AdSenseCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ranAt, setRanAt] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/adsense-check", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to run the check");
      const json = await res.json();
      setData(json);
      setRanAt(new Date().toISOString());
    } catch {
      setError("Could not reach the AdSense check endpoint. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  const checks = data?.checks ?? [];
  const okCount = data?.counts.ok ?? 0;
  const warnCount = data?.counts.warn ?? 0;
  const failCount = data?.counts.fail ?? 0;
  const total = checks.length;
  const progress = total > 0 ? Math.round((okCount / total) * 100) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink-900">
            <BadgeCheck className="h-6 w-6 text-brand-600" />
            AdSense Readiness
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            An interactive pre-flight checklist for your Google AdSense application. Every item is
            checked live against your site — run it again after any change.
          </p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Checking…" : "Run check again"}
        </button>
      </div>

      {/* Progress banner */}
      <div
        className={`mt-6 rounded-xl border p-5 shadow-card ${
          loading
            ? "border-ink-200 bg-white"
            : data?.ready
              ? "border-green-200 bg-green-50/60"
              : "border-ink-200 bg-white"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {loading ? (
              <Loader2 className="h-7 w-7 shrink-0 animate-spin text-brand-600" />
            ) : data?.ready ? (
              <PartyPopper className="h-7 w-7 shrink-0 text-green-600" />
            ) : (
              <AlertTriangle className="h-7 w-7 shrink-0 text-amber-500" />
            )}
            <div>
              <p className={`text-sm font-bold ${data?.ready ? "text-green-800" : "text-ink-900"}`}>
                {loading
                  ? "Running the checklist…"
                  : data?.ready
                    ? "Your site is AdSense-ready! 🎉"
                    : failCount > 0
                      ? `${failCount} item${failCount === 1 ? "" : "s"} need fixing before you apply`
                      : "Almost there — address the warnings below."}
              </p>
              <p className="mt-0.5 text-xs text-ink-500">
                {okCount} of {total} checks pass
                {warnCount > 0 ? ` · ${warnCount} warning${warnCount === 1 ? "" : "s"}` : ""}
                {failCount > 0 ? ` · ${failCount} failing` : ""}
                {data && ` · against ${data.base}`}
                {data && data.base !== data.siteUrl && ` · production ${data.siteUrl}`}
              </p>
            </div>
          </div>
          {data && (
            <div className="w-40">
              <div className="flex items-baseline justify-between text-xs font-semibold text-ink-500">
                <span>Readiness</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    data.ready ? "bg-green-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Checklist */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {checks.map((c) => {
          const Icon = CHECK_ICONS[c.id] ?? FileText;
          const st = STATE_STYLES[c.state];
          return (
            <div
              key={c.id}
              className="rounded-xl border border-ink-200 bg-white p-5 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{c.label}</p>
                    {c.id === "speed" && (
                      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-400">
                        Server response time
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${st.badge}`}
                >
                  {st.label}
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-ink-800">{c.what}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{c.why}</p>

              <p
                className={`mt-3 rounded-md px-3 py-2 text-xs font-medium ${
                  c.state === "ok"
                    ? "bg-green-50 text-green-700"
                    : c.state === "warn"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-red-50 text-red-600"
                }`}
              >
                {c.state === "ok" ? (
                  <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5" />
                ) : c.state === "warn" ? (
                  <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />
                ) : (
                  <XCircle className="mr-1.5 inline h-3.5 w-3.5" />
                )}
                {c.detail}
              </p>
            </div>
          );
        })}
      </div>

      {!loading && !data && !error && (
        <p className="mt-8 text-center text-sm text-ink-400">No data yet.</p>
      )}

      {/* Submission guidance */}
      <section className="mt-8 rounded-xl border border-ink-200 bg-white p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Megaphone className="h-4 w-4 text-brand-600" />
          When you're ready to apply
        </h2>
        <ul className="mt-3 space-y-2.5 text-sm text-ink-600">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <span>
              Fix any <strong className="text-red-600">failing</strong> item and resolve the{" "}
              <strong className="text-amber-600">warnings</strong> that matter — every box green is
              the strongest application.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <span>
              Verify ownership in{" "}
              <strong className="text-ink-800">Google Search Console</strong> (use the SEO Checker
              page for the meta-tag/files) and submit{" "}
              <code className="rounded bg-ink-100 px-1 text-xs">
                {data?.siteUrl ?? "https://cookchase.com"}/sitemap.xml
              </code>
              .
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <span>
              After approval, paste your <strong className="text-ink-800">publisher ID</strong> in{" "}
              Ad Manager → Google AdSense, replace the placeholder in{" "}
              <code className="rounded bg-ink-100 px-1 text-xs">public/ads.txt</code>, redeploy, and
              enable ads.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
            <span>
              Full step-by-step deploy + AdSense guide lives in{" "}
              <code className="rounded bg-ink-100 px-1 text-xs">DEPLOYMENT.md</code>.
            </span>
          </li>
        </ul>
      </section>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-400">
        <Gauge className="h-3.5 w-3.5" />
        Last run:{" "}
        {ranAt
          ? new Date(ranAt).toLocaleString()
          : data
            ? new Date(data.checkedAt).toLocaleTimeString()
            : "—"}
      </p>
    </div>
  );
}
