import { test } from "node:test";
import assert from "node:assert/strict";
import {
  lastDays,
  buildDailySeries,
  analyzeSeries,
  growthPct,
  fmtGrowthPct,
  analyzeToolGrowth,
  pickFastestGrowing,
  pickRunnersUp,
  type TrafficPoint,
  type ToolGrowth
} from "../lib/traffic.ts";

// Fixed "today" so tests never depend on the wall clock.
const NOW = new Date("2026-08-04T12:00:00Z");

test("lastDays returns UTC calendar days oldest-first ending today", () => {
  const days = lastDays(3, NOW);
  assert.deepEqual(days, ["2026-08-02", "2026-08-03", "2026-08-04"]);
  // A 30-day window spans exactly 30 entries with no gaps.
  const d30 = lastDays(30, NOW);
  assert.equal(d30.length, 30);
  assert.equal(d30[0], "2026-07-06");
  assert.equal(d30[29], "2026-08-04");
  // Each consecutive pair differs by exactly one day.
  for (let i = 1; i < d30.length; i++) {
    const prev = Date.parse(d30[i - 1] + "T00:00:00Z");
    const cur = Date.parse(d30[i] + "T00:00:00Z");
    assert.equal(cur - prev, 86400000);
  }
});

test("buildDailySeries zero-fills missing days and ignores out-of-window rows", () => {
  const raw = [
    { date: "2026-08-03", views: 5 },
    { date: "2026-08-04", views: 2 },
    { date: "2026-07-01", views: 999 } // outside window — must be ignored
  ];
  const series = buildDailySeries(raw, 3, NOW);
  assert.deepEqual(series, [
    { date: "2026-08-02", views: 0 },
    { date: "2026-08-03", views: 5 },
    { date: "2026-08-04", views: 2 }
  ]);
});

test("buildDailySeries sums multiple rows for the same day", () => {
  const raw = [
    { date: "2026-08-04", views: 3 },
    { date: "2026-08-04", views: 4 }
  ];
  const series = buildDailySeries(raw, 1, NOW);
  assert.deepEqual(series, [{ date: "2026-08-04", views: 7 }]);
});

test("analyzeSeries computes totals, avg and peak", () => {
  const points: TrafficPoint[] = [
    { date: "2026-08-02", views: 10 },
    { date: "2026-08-03", views: 60 },
    { date: "2026-08-04", views: 20 }
  ];
  const s = analyzeSeries(points, 50);
  assert.equal(s.total, 90);
  assert.equal(s.avg, 30);
  assert.equal(s.peak, 60);
  assert.equal(s.peakDate, "2026-08-03");
});

test("analyzeSeries marks only days at or above the threshold", () => {
  const points: TrafficPoint[] = [
    { date: "2026-08-02", views: 49 }, // below
    { date: "2026-08-03", views: 50 }, // exactly at threshold
    { date: "2026-08-04", views: 0 } // zero is never a spike
  ];
  const s = analyzeSeries(points, 50);
  assert.deepEqual(s.spikeDates, ["2026-08-03"]);
});

test("analyzeSeries with zero/disabled threshold never spikes", () => {
  const points: TrafficPoint[] = [
    { date: "2026-08-02", views: 1000 },
    { date: "2026-08-03", views: 500 }
  ];
  const s = analyzeSeries(points, 0);
  assert.deepEqual(s.spikeDates, []);
  assert.equal(s.peak, 1000);
  assert.equal(s.peakDate, "2026-08-02");
});

test("analyzeSeries empty input is safe", () => {
  const s = analyzeSeries([], 10);
  assert.equal(s.total, 0);
  assert.equal(s.avg, 0);
  assert.equal(s.peak, 0);
  assert.equal(s.peakDate, "");
  assert.deepEqual(s.spikeDates, []);
});

// --- Tool of the day growth helpers ----------------------------------------

test("growthPct computes rounded day-over-day percentage", () => {
  assert.equal(growthPct(60, 40), 50);
  assert.equal(growthPct(40, 60), -33.3);
  assert.equal(growthPct(40, 40), 0);
  assert.equal(growthPct(3, 1), 200);
});

test("growthPct returns null when there is no baseline", () => {
  assert.equal(growthPct(10, 0), null);
  assert.equal(growthPct(0, 0), null);
  assert.equal(growthPct(5, -2), null);
});

test("fmtGrowthPct signs positive growth and renders null as an em dash", () => {
  assert.equal(fmtGrowthPct(50), "+50%");
  assert.equal(fmtGrowthPct(-33.3), "-33.3%");
  assert.equal(fmtGrowthPct(0), "0%");
  assert.equal(fmtGrowthPct(12.5), "+12.5%");
  assert.equal(fmtGrowthPct(null), "—");
});

function growthSeries(views: number[]): TrafficPoint[] {
  return views.map((v, i) => ({ date: `2026-08-${String(i + 1).padStart(2, "0")}`, views: v }));
}

const META = { slug: "x", name: "X", category: "Baking" };

test("analyzeToolGrowth compares today vs yesterday and last week", () => {
  // 10 days ending today: last element is today, second-last yesterday,
  // eighth-last is the same weekday last week.
  const series = growthSeries([5, 5, 5, 5, 5, 5, 5, 5, 40, 60]);
  const g = analyzeToolGrowth(series, META);
  assert.equal(g.today, 60);
  assert.equal(g.yesterday, 40);
  assert.equal(g.lastWeek, 5);
  assert.equal(g.dayGrowthPct, 50);
  assert.equal(g.weekGrowthPct, 1100);
});

test("analyzeToolGrowth handles short series and zero baselines", () => {
  const g = analyzeToolGrowth(growthSeries([10]), META);
  assert.equal(g.today, 10);
  assert.equal(g.yesterday, 0);
  assert.equal(g.lastWeek, 0);
  assert.equal(g.dayGrowthPct, null);
  assert.equal(g.weekGrowthPct, null);
});

function tool(slug: string, today: number, yesterday: number): ToolGrowth {
  return {
    slug,
    name: slug,
    category: "C",
    today,
    yesterday,
    lastWeek: 0,
    dayGrowthPct: growthPct(today, yesterday),
    weekGrowthPct: null
  };
}

test("pickFastestGrowing picks highest day-over-day growth", () => {
  const stats = [
    tool("a", 30, 20), // +50%
    tool("b", 90, 50), // +80%
    tool("c", 15, 10) // +50% — ties with a, fewer views today
  ];
  const w = pickFastestGrowing(stats);
  assert.equal(w?.slug, "b");
});

test("pickFastestGrowing ties break by today's absolute views", () => {
  const stats = [tool("a", 30, 20), tool("c", 15, 10)];
  assert.equal(pickFastestGrowing(stats)?.slug, "a");
});

test("pickFastestGrowing excludes tools below min activity and no-baseline tools", () => {
  const stats = [
    tool("blip", 2, 1), // +100% but only 2 views today (< minToday)
    tool("new", 40, 0), // no yesterday baseline → null growth
    tool("steady", 25, 20) // +25%, real activity
  ];
  const w = pickFastestGrowing(stats);
  assert.equal(w?.slug, "steady");
  assert.equal(pickFastestGrowing([tool("x", 1, 1)]), null); // no eligible candidate
});

test("pickRunnersUp returns top growth tools excluding the winner", () => {
  const stats = [
    tool("win", 100, 50),
    tool("r1", 60, 40),
    tool("r2", 50, 40),
    tool("r3", 80, 70),
    tool("r4", 30, 20)
  ];
  // r1 +50%, r4 +50%, r2 +25%, r3 +14.3% — the first three by growth win.
  const runners = pickRunnersUp(stats, "win", 3);
  assert.deepEqual(runners.map((r) => r.slug), ["r1", "r4", "r2"]);
});

test("pickRunnersUp applies the same minToday activity floor as the winner", () => {
  const stats = [
    tool("blip", 2, 1), // +100% but only 2 views today — must be excluded
    tool("quiet", 1, 0), // no baseline → excluded anyway
    tool("real", 25, 20) // +25%, real activity
  ];
  const runners = pickRunnersUp(stats, null, 3);
  assert.deepEqual(runners.map((r) => r.slug), ["real"]);
});
