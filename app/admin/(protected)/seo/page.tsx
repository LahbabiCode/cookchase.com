"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SearchCheck,
  ExternalLink,
  RefreshCw,
  FileText,
  ShieldCheck,
  FileCode2,
  Map,
  Globe,
  ScanSearch,
  Compass,
  Pin,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";

interface CheckResult {
  id: string;
  label: string;
  purpose: string;
  path: string;
  url: string;
  expected: string;
  status: number;
  ms: number;
  state: "ok" | "warn" | "fail";
  note: string;
  contentCheck?: string;
}

interface SeoCheckResponse {
  checkedAt: string;
  base: string;
  siteUrl: string;
  googleConfigured: boolean;
  checks: CheckResult[];
}

const FILE_ICONS: Record<string, typeof FileText> = {
  homepage: Globe,
  "ads.txt": FileText,
  "robots.txt": FileCode2,
  "sitemap.xml": Map,
  "google-file": ShieldCheck,
  "bing-file": ScanSearch,
  "yandex-file": Compass,
  "pinterest-file": Pin
};

const STATE_STYLES: Record<CheckResult["state"], { badge: string; text: string; label: string }> = {
  ok: {
    badge: "bg-green-50 text-green-700 border-green-200",
    text: "text-green-700",
    label: "OK"
  },
  warn: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    text: "text-amber-700",
    label: "Warning"
  },
  fail: {
    badge: "bg-red-50 text-red-600 border-red-200",
    text: "text-red-600",
    label: "Failing"
  }
};

export default function SeoCheckerAdmin() {
  const [data, setData] = useState<SeoCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const run = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/seo-check", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to run SEO check");
      setData(await res.json());
    } catch {
      setError("Could not reach the SEO check endpoint. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  const counts = (data?.checks ?? []).reduce(
    (acc, c) => {
      acc[c.state] = (acc[c.state] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const total = data?.checks.length ?? 0;
  const okCount = counts.ok ?? 0;
  const allGood = total > 0 && okCount === total;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink-900">
            <SearchCheck className="h-6 w-6 text-brand-600" />
            SEO Checker
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            Verifies every file Google, Bing, Yandex, Pinterest and AdSense rely on — with live
            HTTP status and a direct link to each one.
          </p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Checking…" : "Re-check now"}
        </button>
      </div>

      {/* Summary strip */}
      <div
        className={`mt-6 rounded-xl border p-4 shadow-card ${
          allGood ? "border-green-200 bg-green-50/60" : "border-ink-200 bg-white"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {allGood ? (
              <CheckCircle2 className="h-6 w-6 shrink-0 text-green-600" />
            ) : loading ? (
              <Loader2 className="h-6 w-6 shrink-0 animate-spin text-brand-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 shrink-0 text-amber-500" />
            )}
            <div>
              <p className={`text-sm font-semibold ${allGood ? "text-green-800" : "text-ink-900"}`}>
                {loading
                  ? "Running checks…"
                  : allGood
                    ? `${okCount} of ${total} SEO files reachable and valid`
                    : `${okCount} of ${total} files OK — ${(counts.warn ?? 0) + (counts.fail ?? 0)} need attention`}
              </p>
              {data && (
                <p className="mt-0.5 text-xs text-ink-500">
                  Checked against {data.base}
                  {data.base !== data.siteUrl && ` · Production: ${data.siteUrl}`} ·{" "}
                  {new Date(data.checkedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          {data && (
            <div className="flex gap-2 text-xs font-semibold">
              <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-green-700">
                {counts.ok ?? 0} OK
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
                {counts.warn ?? 0} Warnings
              </span>
              <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-red-600">
                {counts.fail ?? 0} Failing
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* File cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(data?.checks ?? []).map((c) => {
          const Icon = FILE_ICONS[c.id] ?? FileText;
          const st = STATE_STYLES[c.state];
          const statusColor =
            c.status === 0
              ? "text-red-600"
              : c.status >= 200 && c.status < 300
                ? "text-green-700"
                : c.status >= 500
                  ? "text-red-600"
                  : "text-amber-600";
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
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">{c.label}</p>
                    <code className="mt-0.5 block truncate text-xs text-ink-500">{c.path}</code>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${st.badge}`}
                >
                  {c.state === "ok" && c.status > 0
                    ? `${c.status}`
                    : c.status === 0
                      ? "Unreachable"
                      : st.label}
                </span>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-ink-500">{c.purpose}</p>

              <div className="mt-3 flex items-center gap-3 text-xs">
                <span className={`font-mono font-bold ${statusColor}`}>
                  HTTP {c.status || "—"}
                </span>
                <span className="text-ink-400">·</span>
                <span className="text-ink-500">{c.ms} ms</span>
                <span className="text-ink-400">·</span>
                <span className="text-ink-500">expect {c.expected}</span>
              </div>

              <p className={`mt-2 text-xs leading-relaxed ${st.text}`}>{c.note}</p>
              {c.contentCheck && (
                <p className="mt-2 rounded-md bg-ink-50 px-3 py-2 text-xs text-ink-600">
                  {c.contentCheck}
                </p>
              )}

              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-brand-400 hover:text-brand-600"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open file
              </a>
            </div>
          );
        })}
      </div>

      {!loading && !data && !error && (
        <p className="mt-8 text-center text-sm text-ink-400">No data yet.</p>
      )}

      {/* Reference */}
      <section className="mt-8 rounded-xl border border-ink-200 bg-white p-5 shadow-card">
        <h2 className="text-sm font-semibold text-ink-900">What to do next</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-600">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <span>
              <strong className="text-ink-800">Google Search Console:</strong> verify ownership
              (meta tag or <code className="rounded bg-ink-100 px-1 text-xs">google&lt;code&gt;.html</code>),
              then submit <code className="rounded bg-ink-100 px-1 text-xs">{data?.siteUrl ?? "https://cookchase.com"}/sitemap.xml</code>.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <span>
              <strong className="text-ink-800">AdSense:</strong> replace{" "}
              <code className="rounded bg-ink-100 px-1 text-xs">pub-XXXXXXXXXXXXXXXX</code> in{" "}
              <code className="rounded bg-ink-100 px-1 text-xs">public/ads.txt</code> with your real
              publisher ID and redeploy.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
            <span>
              <strong className="text-ink-800">robots.txt</strong> and{" "}
              <strong className="text-ink-800">sitemap.xml</strong> are generated automatically from
              your tools and articles — if they 404, re-run this check after the next deploy.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <ScanSearch className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <span>
              <strong className="text-ink-800">Bing:</strong> paste your code from Bing Webmaster
              Tools into Ad Manager → Search engines → Bing verification. It renders as the{" "}
              <code className="rounded bg-ink-100 px-1 text-xs">msvalidate.01</code> meta tag and
              makes <code className="rounded bg-ink-100 px-1 text-xs">/BingSiteAuth.xml</code> live
              (Bing accepts the 404 while unclaimed).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Compass className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <span>
              <strong className="text-ink-800">Yandex:</strong> add the code from Yandex Webmaster
              in Ad Manager → Search engines → Yandex verification. It renders as the{" "}
              <code className="rounded bg-ink-100 px-1 text-xs">yandex-verification</code> meta tag
              and serves <code className="rounded bg-ink-100 px-1 text-xs">/yandex_&lt;code&gt;.html</code>{" "}
              automatically.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Pin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <span>
              <strong className="text-ink-800">Pinterest:</strong> add the code from Pinterest
              Business in Ad Manager → Search engines → Pinterest verification. It renders as the{" "}
              <code className="rounded bg-ink-100 px-1 text-xs">p:domain_verify</code> meta tag and
              serves <code className="rounded bg-ink-100 px-1 text-xs">/pinterest-&lt;code&gt;.html</code>{" "}
              automatically.
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
