import Link from "next/link";
import { ArrowRight, CalendarDays, Flame, TrendingUp, Trophy } from "lucide-react";
import type { ToolOfTheDay as ToolOfTheDayData } from "@/lib/queries";

function fmtViews(v: number): string {
  return v.toLocaleString("en-US");
}

/** "+42%" / "−8%" / "flat" — growth delta with a stable sign. */
function fmtPct(pct: number | null, baseline: number): string {
  if (pct === null) return baseline <= 0 ? "new" : "—";
  if (pct === 0) return "flat";
  const sign = pct > 0 ? "+" : "−";
  return `${sign}${Math.abs(pct).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}

function pctColor(pct: number | null): string {
  if (pct === null) return "text-amber-600";
  if (pct > 0) return "text-emerald-600";
  if (pct < 0) return "text-red-600";
  return "text-ink-500";
}

export default function ToolOfTheDay({ data }: { data: ToolOfTheDayData }) {
  const w = data.winner;

  return (
    <section className="overflow-hidden rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-amber-50 p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Trophy className="h-4 w-4" />
            </span>
            <div>
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                Tool of the day
                <span className="hidden items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 sm:inline-flex">
                  <CalendarDays className="h-3 w-3" /> {data.asOf}
                </span>
              </h2>
              <p className="text-xs text-ink-500">
                Automatically compares today&apos;s views against yesterday and
                the same day last week.
              </p>
            </div>
          </div>

          {w ? (
            <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
              <div>
                <p className="text-lg font-bold leading-tight text-ink-900">{w.name}</p>
                <p className="text-xs text-ink-400">{w.category}</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold tabular-nums text-brand-700">
                  {fmtViews(w.today)}
                </p>
                <p className="text-xs font-medium text-ink-500">views today</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className={`inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 font-semibold shadow-sm ${pctColor(w.dayGrowthPct)}`}>
                  <Flame className="h-3.5 w-3.5" />
                  {fmtPct(w.dayGrowthPct, w.yesterday)} vs yesterday
                </span>
                <span className={`inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold shadow-sm ${pctColor(w.weekGrowthPct)}`}>
                  <TrendingUp className="h-3.5 w-3.5" />
                  {fmtPct(w.weekGrowthPct, w.lastWeek)} vs last week
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-ink-300 py-5 text-center text-sm text-ink-400">
              No clear winner yet — tools need at least 3 views today and views
              yesterday to compare. Traffic will appear here automatically.
            </div>
          )}
        </div>

        <div className="shrink-0">
          <Link
            href="/admin/stats"
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
          >
            Full traffic chart
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {(w || data.runnersUp.length > 0) && (
        <div className="mt-4 grid gap-3 border-t border-ink-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Site-wide totals */}
          <div className="rounded-lg bg-white/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Site — all tools
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-ink-900">
              {fmtViews(data.siteToday)}
              <span className={`ml-2 text-xs font-semibold ${pctColor(data.siteDayGrowthPct)}`}>
                {fmtPct(data.siteDayGrowthPct, data.siteYesterday)} vs yesterday
              </span>
            </p>
            <p className="text-[11px] text-ink-400">
              {fmtViews(data.siteYesterday)} yesterday · {fmtViews(data.siteLastWeek)} last week
            </p>
          </div>

          {/* Runner-up tools */}
          {data.runnersUp.slice(0, 3).map((r) => (
            <div key={r.slug} className="rounded-lg bg-white/70 p-3">
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                Runner-up
              </p>
              <p className="mt-1 truncate text-sm font-bold text-ink-900">{r.name}</p>
              <p className="text-[11px] text-ink-500">
                {fmtViews(r.today)} today ·{" "}
                <span className={`font-semibold ${pctColor(r.dayGrowthPct)}`}>
                  {fmtPct(r.dayGrowthPct, r.yesterday)}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
