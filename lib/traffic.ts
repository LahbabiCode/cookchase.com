// Traffic analytics for the admin panel — per-tool daily view series with
// spike days (threshold crossings) marked for the line chart.
//
// This module is PURE on purpose: it only imports from the standard library,
// so the node --test runner can load it directly (the codebase imports are
// extension-less and only resolve under Next/webpack). The SQLite-backed
// buildTrafficData() lives in lib/queries.ts and consumes these helpers.

export interface TrafficPoint {
  date: string; // YYYY-MM-DD (UTC)
  views: number;
}

export interface ToolTraffic {
  slug: string;
  name: string;
  category: string;
  total: number; // views in the whole period
  avg: number; // daily average across the period
  peak: number; // best single day
  peakDate: string; // "" when the tool has no views in the period
  spikeDates: string[]; // days the tool crossed the views threshold
  series: TrafficPoint[];
}

export interface TrafficData {
  days: number;
  startDate: string;
  endDate: string;
  siteTotal: number; // tool views only (articles excluded, same as other tool reports)
  siteSeries: TrafficPoint[];
  tools: ToolTraffic[];
  viewsThreshold: number; // tools views threshold from Settings (0 = disabled)
}

/** UTC YYYY-MM-DD string for a Date. */
function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Last `days` UTC calendar days (YYYY-MM-DD), oldest first, ending today.
 * Pure so tests can pin `now`.
 */
export function lastDays(days: number, now = new Date()): string[] {
  const out: string[] = [];
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    out.push(isoDay(d));
  }
  return out;
}

/**
 * Zero-filled daily series for `days` calendar days ending today, built from
 * raw analytics rows. Rows outside the window are ignored; multiple rows for
 * the same day (never happens for analytics, but defensive) are summed.
 */
export function buildDailySeries(
  raw: { date: string; views: number }[],
  days: number,
  now = new Date()
): TrafficPoint[] {
  const dates = lastDays(days, now);
  const byDate = new Map<string, number>();
  for (const r of raw) byDate.set(r.date, (byDate.get(r.date) || 0) + r.views);
  return dates.map((date) => ({ date, views: byDate.get(date) || 0 }));
}

export interface SeriesStats {
  total: number;
  avg: number;
  peak: number;
  peakDate: string;
  spikeDates: string[];
}

// --- "Tool of the day" growth ---------------------------------------------

/**
 * Growth % between a current value and its baseline. Rounded to one decimal.
 * Returns null when there is no baseline to compare against (prev <= 0) — an
 * infinite/undefined growth can't be ranked, so callers treat null separately.
 */
export function growthPct(current: number, prev: number): number | null {
  if (prev <= 0) return null;
  return Math.round(((current - prev) / prev) * 1000) / 10;
}

/**
 * Format a growth percentage for report tables: "+50%", "-33.3%", "0%", or
 * "—" when there is no baseline to compare against (null growth). Used by the
 * CSV/PDF report growth columns.
 */
export function fmtGrowthPct(pct: number | null): string {
  if (pct === null) return "—";
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

/**
 * Per-tool daily comparison: today vs yesterday (day-over-day) and today vs
 * the same weekday last week (the "anniversary" comparison). Works off a
 * zero-filled daily series ending today, so missing days read as 0 views.
 */
export interface ToolGrowth {
  slug: string;
  name: string;
  category: string;
  today: number;
  yesterday: number;
  lastWeek: number;
  dayGrowthPct: number | null;
  weekGrowthPct: number | null;
}

export function analyzeToolGrowth(
  series: TrafficPoint[],
  meta: { slug: string; name: string; category: string }
): ToolGrowth {
  const n = series.length;
  const today = n > 0 ? series[n - 1].views : 0;
  const yesterday = n > 1 ? series[n - 2].views : 0;
  const lastWeek = n > 7 ? series[n - 8].views : 0;
  return {
    slug: meta.slug,
    name: meta.name,
    category: meta.category,
    today,
    yesterday,
    lastWeek,
    dayGrowthPct: growthPct(today, yesterday),
    weekGrowthPct: growthPct(today, lastWeek)
  };
}

/**
 * Pick the fastest-growing tool of the day.
 *
 * Candidates must have real activity today (>= minToday views) AND a
 * yesterday baseline, so a one-view blip on a tool that was dead yesterday
 * doesn't win. Among those, highest day-over-day growth wins, ties broken by
 * today's absolute views. Returns null when nothing qualifies — the dashboard
 * then shows a neutral empty state instead of a misleading winner.
 */
export function pickFastestGrowing(
  stats: ToolGrowth[],
  minToday = 3
): ToolGrowth | null {
  const eligible = stats.filter(
    (s) => s.today >= minToday && s.dayGrowthPct !== null
  );
  if (eligible.length === 0) return null;
  return [...eligible].sort(
    (a, b) =>
      (b.dayGrowthPct ?? -Infinity) - (a.dayGrowthPct ?? -Infinity) ||
      b.today - a.today
  )[0];
}

/**
 * Runner-up tools ranked by day-over-day growth (winner excluded). Same
 * minToday activity floor as the winner so a 1–2 view blip on a dead tool
 * can't masquerade as a runner-up next to a real winner.
 */
export function pickRunnersUp(
  stats: ToolGrowth[],
  winnerSlug: string | null,
  limit = 3,
  minToday = 3
): ToolGrowth[] {
  return stats
    .filter(
      (s) =>
        s.slug !== winnerSlug &&
        s.dayGrowthPct !== null &&
        s.today >= minToday
    )
    .sort(
      (a, b) =>
        (b.dayGrowthPct ?? -Infinity) - (a.dayGrowthPct ?? -Infinity) ||
        b.today - a.today
    )
    .slice(0, limit);
}

/**
 * Analyze a daily series against the views threshold: totals, best day, and
 * every day that crossed the threshold (a "spike"). A day with zero views can
 * never be a spike, and a zero/disabled threshold disables spike detection.
 */
export function analyzeSeries(points: TrafficPoint[], threshold: number): SeriesStats {
  let total = 0;
  let peak = 0;
  let peakDate = "";
  const spikeDates: string[] = [];
  for (const p of points) {
    total += p.views;
    if (p.views > peak) {
      peak = p.views;
      peakDate = p.date;
    }
    if (threshold > 0 && p.views > 0 && p.views >= threshold) {
      spikeDates.push(p.date);
    }
  }
  return {
    total,
    avg: points.length ? Math.round((total / points.length) * 10) / 10 : 0,
    peak,
    peakDate,
    spikeDates
  };
}
