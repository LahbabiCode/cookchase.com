"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarDays,
  Eye,
  Flame,
  GitCompareArrows,
  Minus,
  TrendingUp,
  X
} from "lucide-react";
import {
  analyzeToolGrowth,
  type ToolGrowth,
  type ToolTraffic,
  type TrafficData,
  type TrafficPoint
} from "@/lib/traffic";

const RANGES = [7, 30, 90] as const;
const CHART_H = 300;
const PAD = { L: 44, R: 16, T: 18, B: 34 };

// Distinct, colorblind-friendly line colors for the comparison chart.
const PALETTE = [
  "#d97706", // brand amber
  "#2563eb", // blue
  "#059669", // emerald
  "#7c3aed", // violet
  "#db2777", // pink
  "#0891b2", // cyan
  "#dc2626", // red
  "#4b5563" // slate
];

/** Round a value up to a "nice" axis maximum (1/2/5 × 10^n) so gridlines land on clean numbers. */
function niceMax(v: number): number {
  if (v <= 1) return 10;
  const exp = Math.floor(Math.log10(v));
  const base = Math.pow(10, exp);
  const frac = v / base;
  const nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return nice * base;
}

function fmtDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

// ------------------------------------------------------- shared chart bits ----

/** ResizeObserver-backed wrapper width, shared by every chart here. */
function useChartSize() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  return { wrapRef, width };
}

interface ChartGeometry {
  n: number;
  maxV: number;
  stepX: number;
  x: (i: number) => number;
  y: (v: number) => number;
  xLabels: { i: number; date: string }[];
  gridLines: { v: number; y: number }[];
}

/**
 * Shared coordinate math for the line charts: maps data indexes/values to SVG
 * pixels and builds the x/y axis labels. Both charts derive every pixel from
 * this so gridlines, labels and hover crosshairs always agree.
 */
function chartGeometry(
  width: number,
  points: TrafficPoint[],
  maxValue: number
): ChartGeometry {
  const n = points.length;
  const maxV = niceMax(maxValue);
  const plotW = Math.max(width - PAD.L - PAD.R, 120);
  const plotH = CHART_H - PAD.T - PAD.B;
  const stepX = n > 1 ? plotW / (n - 1) : plotW;

  const x = (i: number) => PAD.L + i * stepX;
  const y = (v: number) => PAD.T + plotH * (1 - v / maxV);

  const labelEvery = Math.max(1, Math.ceil(n / 6));
  const xLabels = points
    .map((p, i) => ({ i, date: p.date }))
    .filter((_, i) => i % labelEvery === 0 || i === n - 1);

  const gridLines = [0.25, 0.5, 0.75, 1].map((f) => ({
    v: Math.round(maxV * f),
    y: PAD.T + plotH * (1 - f)
  }));

  return { n, maxV, stepX, x, y, xLabels, gridLines };
}

/** Green/red/gray growth pill; null (no baseline) renders a dash. */
function GrowthBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-ink-300">—</span>;
  }
  const up = pct > 0;
  const down = pct < 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
        up
          ? "bg-emerald-50 text-emerald-700"
          : down
            ? "bg-red-50 text-red-600"
            : "bg-ink-50 text-ink-500"
      }`}
    >
      {up ? (
        <ArrowUp className="h-3 w-3" />
      ) : down ? (
        <ArrowDown className="h-3 w-3" />
      ) : (
        <Minus className="h-3 w-3" />
      )}
      {Math.abs(pct)}%
    </span>
  );
}

// -------------------------------------------------------------- line chart ----

interface ChartProps {
  tool: ToolTraffic;
  threshold: number;
}

function LineChart({ tool, threshold }: ChartProps) {
  const { wrapRef, width } = useChartSize();
  const [hover, setHover] = useState<number | null>(null);

  const points = tool.series;
  const geo = chartGeometry(
    width,
    points,
    Math.max(...points.map((p) => p.views), threshold)
  );
  const n = geo.n;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${geo.x(i).toFixed(1)},${geo.y(p.views).toFixed(1)}`)
    .join(" ");
  const areaPath =
    n > 0
      ? `${linePath} L${geo.x(n - 1).toFixed(1)},${geo.y(0).toFixed(1)} L${geo.x(0).toFixed(1)},${geo.y(0).toFixed(1)} Z`
      : "";

  // Spike days = days that crossed the threshold (same rule as the backend).
  const spikeSet = useMemo(() => new Set(tool.spikeDates), [tool.spikeDates]);
  const yThr = threshold > 0 ? geo.y(threshold) : null;

  const hovered = hover !== null ? points[hover] : null;
  const hoverIsSpike = hovered ? spikeSet.has(hovered.date) : false;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = e.clientX - rect.left - PAD.L;
    const idx = Math.round(rel / geo.stepX);
    setHover(Math.max(0, Math.min(n - 1, idx)));
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      {width > 0 && (
        <svg
          viewBox={`0 0 ${width} ${CHART_H}`}
          className="w-full select-none"
          role="img"
          aria-label={`${tool.name} daily views — last ${n} days`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="cc-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* gridlines + y labels */}
          {geo.gridLines.map((g) => (
            <g key={g.v}>
              <line
                x1={PAD.L}
                x2={width - PAD.R}
                y1={g.y}
                y2={g.y}
                className="stroke-ink-100"
                strokeWidth={1}
              />
              <text x={PAD.L - 8} y={g.y + 4} textAnchor="end" className="fill-ink-400 text-[10px]">
                {g.v.toLocaleString()}
              </text>
            </g>
          ))}

          {/* threshold dashed line */}
          {yThr !== null && (
            <g>
              <line
                x1={PAD.L}
                x2={width - PAD.R}
                y1={yThr}
                y2={yThr}
                className="stroke-amber-500"
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
              <text
                x={width - PAD.R}
                y={Math.max(yThr - 6, 10)}
                textAnchor="end"
                className="fill-amber-600 text-[10px] font-semibold"
              >
                threshold {threshold.toLocaleString()}
              </text>
            </g>
          )}

          {/* area + line */}
          {n > 0 && (
            <>
              <path d={areaPath} fill="url(#cc-area)" />
              <path d={linePath} fill="none" className="stroke-brand-600" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            </>
          )}

          {/* spike markers */}
          {points.map((p, i) =>
            spikeSet.has(p.date) ? (
              <circle
                key={p.date}
                cx={geo.x(i)}
                cy={geo.y(p.views)}
                r={hover === i ? 6 : 4.5}
                className="fill-amber-500 transition-all duration-150"
                stroke="white"
                strokeWidth={1.5}
              />
            ) : null
          )}

          {/* hover crosshair + dot */}
          {hovered && (
            <g pointerEvents="none">
              <line x1={geo.x(hover!)} x2={geo.x(hover!)} y1={PAD.T} y2={CHART_H - PAD.B} className="stroke-ink-300" strokeWidth={1} />
              <circle cx={geo.x(hover!)} cy={geo.y(hovered.views)} r={5} className="fill-ink-900" stroke="white" strokeWidth={2} />
            </g>
          )}

          {/* x labels */}
          {geo.xLabels.map(({ i, date }) => (
            <text
              key={date}
              x={geo.x(i)}
              y={CHART_H - PAD.B + 18}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              className="fill-ink-400 text-[10px]"
            >
              {fmtDay(date)}
            </text>
          ))}
        </svg>
      )}

      {/* tooltip */}
      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-ink-200 bg-white px-3 py-2 shadow-lift"
          style={{
            left: Math.min(Math.max(geo.x(hover), 70), width - 70),
            top: Math.max(geo.y(hovered.views) - 74, 2)
          }}
        >
          <p className="text-xs font-semibold text-ink-900">
            {fmtDay(hovered.date)} ·{" "}
            <span className="text-brand-600">{hovered.views.toLocaleString()} views</span>
          </p>
          {hoverIsSpike && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-amber-600">
              <Flame className="h-3 w-3" /> Spike — crossed the threshold
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------ comparison chart ----

interface CompareChartProps {
  tools: ToolTraffic[]; // every selected tool, in legend order
  threshold: number;
}

/**
 * Overlaid daily curves for several tools at once, sharing one x-axis. Hover
 * shows a crosshair plus every tool's value on that day, each in its own color
 * so you can compare shapes and peaks directly.
 */
function CompareChart({ tools, threshold }: CompareChartProps) {
  const { wrapRef, width } = useChartSize();
  const [hover, setHover] = useState<number | null>(null);

  const points = tools[0]?.series ?? [];
  const n = points.length;
  const maxVal = Math.max(
    ...tools.flatMap((t) => t.series.map((p) => p.views)),
    threshold
  );
  const geo = chartGeometry(width, points, maxVal);
  const yThr = threshold > 0 ? geo.y(threshold) : null;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = e.clientX - rect.left - PAD.L;
    const idx = Math.round(rel / geo.stepX);
    setHover(Math.max(0, Math.min(n - 1, idx)));
  };

  const hovered = hover !== null && n > 0 ? points[hover] : null;

  return (
    <div ref={wrapRef} className="relative w-full">
      {width > 0 && n > 0 && (
        <svg
          viewBox={`0 0 ${width} ${CHART_H}`}
          className="w-full select-none"
          role="img"
          aria-label="Daily views comparison across selected tools"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* gridlines + y labels */}
          {geo.gridLines.map((g) => (
            <g key={g.v}>
              <line
                x1={PAD.L}
                x2={width - PAD.R}
                y1={g.y}
                y2={g.y}
                className="stroke-ink-100"
                strokeWidth={1}
              />
              <text x={PAD.L - 8} y={g.y + 4} textAnchor="end" className="fill-ink-400 text-[10px]">
                {g.v.toLocaleString()}
              </text>
            </g>
          ))}

          {/* threshold dashed line */}
          {yThr !== null && (
            <g>
              <line
                x1={PAD.L}
                x2={width - PAD.R}
                y1={yThr}
                y2={yThr}
                className="stroke-amber-500"
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
              <text
                x={width - PAD.R}
                y={Math.max(yThr - 6, 10)}
                textAnchor="end"
                className="fill-amber-600 text-[10px] font-semibold"
              >
                threshold {threshold.toLocaleString()}
              </text>
            </g>
          )}

          {/* one line per tool */}
          {tools.map((t, ti) => {
            const color = PALETTE[ti % PALETTE.length];
            const path = t.series
              .map((p, i) => `${i === 0 ? "M" : "L"}${geo.x(i).toFixed(1)},${geo.y(p.views).toFixed(1)}`)
              .join(" ");
            return (
              <path
                key={t.slug}
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={2.2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            );
          })}

          {/* hover crosshair + one dot per tool */}
          {hover !== null && (
            <g pointerEvents="none">
              <line x1={geo.x(hover)} x2={geo.x(hover)} y1={PAD.T} y2={CHART_H - PAD.B} className="stroke-ink-300" strokeWidth={1} />
              {tools.map((t, ti) => (
                <circle
                  key={t.slug}
                  cx={geo.x(hover)}
                  cy={geo.y(t.series[hover].views)}
                  r={4.5}
                  fill={PALETTE[ti % PALETTE.length]}
                  stroke="white"
                  strokeWidth={1.5}
                />
              ))}
            </g>
          )}

          {/* x labels */}
          {geo.xLabels.map(({ i, date }) => (
            <text
              key={date}
              x={geo.x(i)}
              y={CHART_H - PAD.B + 18}
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
              className="fill-ink-400 text-[10px]"
            >
              {fmtDay(date)}
            </text>
          ))}
        </svg>
      )}

      {/* hover tooltip: every tool's value on that day */}
      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 rounded-lg border border-ink-200 bg-white px-3 py-2 shadow-lift"
          style={{
            // Keep the 224px-wide tooltip fully on screen: clamp its center to
            // a comfortable inset from both edges.
            left: Math.min(Math.max(geo.x(hover), 120), width - 120),
            top: 2
          }}
        >
          <p className="text-xs font-semibold text-ink-900">{fmtDay(hovered.date)}</p>
          <div className="mt-1.5 space-y-1">
            {tools.map((t, ti) => (
              <p key={t.slug} className="flex items-center gap-1.5 text-[11px] text-ink-600">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: PALETTE[ti % PALETTE.length] }}
                />
                <span className="truncate font-medium text-ink-800">{t.name}</span>
                <span className="ml-auto pl-3 font-semibold tabular-nums text-ink-900">
                  {t.series[hover].views.toLocaleString()}
                </span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------- main UI ----

export default function TrafficAnalytics() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<TrafficData | null>(null);
  const [slug, setSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Comparison chart: which tools are overlaid right now. Defaults to the top
  // 5 by period views; once the admin touches the selection we keep it.
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);
  const [compareTouched, setCompareTouched] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/admin/stats?days=${days}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: TrafficData) => {
        if (!alive) return;
        setData(j);
        setSlug((s) => (j.tools.some((t) => t.slug === s) ? s : j.tools[0]?.slug || ""));
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [days]);

  // Reset/repair the comparison selection whenever fresh data arrives.
  useEffect(() => {
    if (!data) return;
    if (compareTouched) {
      // Keep the admin's picks, dropping slugs that vanished from the period.
      setCompareSlugs((prev) => prev.filter((s) => data.tools.some((t) => t.slug === s)));
    } else {
      setCompareSlugs(data.tools.slice(0, 5).map((t) => t.slug));
    }
  }, [data, compareTouched]);

  const tool = useMemo(
    () => data?.tools.find((t) => t.slug === slug) || data?.tools[0] || null,
    [data, slug]
  );

  const compareTools = useMemo(
    () => (data ? data.tools.filter((t) => compareSlugs.includes(t.slug)) : []),
    [data, compareSlugs]
  );

  // Per-tool growth (today vs yesterday, today vs same day last week) — pure
  // math over the zero-filled daily series the API already returns.
  const growthMap = useMemo(() => {
    const m = new Map<string, ToolGrowth>();
    for (const t of data?.tools ?? []) {
      m.set(
        t.slug,
        analyzeToolGrowth(t.series, {
          slug: t.slug,
          name: t.name,
          category: t.category
        })
      );
    }
    return m;
  }, [data]);

  const addCompareTool = (s: string) => {
    setCompareTouched(true);
    setCompareSlugs((prev) => (prev.includes(s) ? prev : [...prev, s]));
  };
  const removeCompareTool = (s: string) => {
    setCompareTouched(true);
    setCompareSlugs((prev) => prev.filter((x) => x !== s));
  };
  const resetCompare = (toTop: boolean) => {
    setCompareTouched(true);
    setCompareSlugs(toTop ? (data?.tools.slice(0, 5).map((t) => t.slug) ?? []) : []);
  };

  const spikeEvents = useMemo(
    () => (data ? data.tools.reduce((s, t) => s + t.spikeDates.length, 0) : 0),
    [data]
  );
  const topTool = data?.tools[0] || null;
  const siteAvg = data ? Math.round((data.siteTotal / data.days) * 10) / 10 : 0;

  if (loading && !data) {
    return <div className="animate-pulse p-10 text-center text-sm text-ink-400">Loading traffic data…</div>;
  }
  if (!data || !tool) {
    return (
      <div className="rounded-xl border border-dashed border-ink-300 py-12 text-center text-sm text-ink-400">
        No traffic data yet — visit your tools or articles to see the chart here.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Range + tool selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-ink-200 bg-white p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                days === r ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-100"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <span className="font-medium">Tool:</span>
          <select
            value={tool.slug}
            onChange={(e) => setSlug(e.target.value)}
            className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-900 shadow-sm focus:border-brand-500 focus:outline-none"
          >
            {data.tools.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name} ({t.total.toLocaleString()} views)
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <p className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
            <Eye className="h-3.5 w-3.5 text-brand-600" /> Views · {data.days}d
          </p>
          <p className="mt-1.5 text-2xl font-bold text-ink-900">{data.siteTotal.toLocaleString()}</p>
          <p className="text-xs text-ink-400">{siteAvg.toLocaleString()} avg per day</p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <p className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Top tool
          </p>
          <p className="mt-1.5 truncate text-lg font-bold text-ink-900">{topTool?.name}</p>
          <p className="text-xs text-ink-400">{topTool?.total.toLocaleString()} views in period</p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <p className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
            <Flame className="h-3.5 w-3.5 text-amber-500" /> Spike days
          </p>
          <p className="mt-1.5 text-2xl font-bold text-ink-900">{spikeEvents}</p>
          <p className="text-xs text-ink-400">
            threshold {data.viewsThreshold > 0 ? data.viewsThreshold.toLocaleString() : "off"} views/day
          </p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <p className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
            <BarChart3 className="h-3.5 w-3.5 text-blue-600" /> Selected tool
          </p>
          <p className="mt-1.5 text-2xl font-bold text-ink-900">{tool.total.toLocaleString()}</p>
          <p className="text-xs text-ink-400">
            peak {tool.peak.toLocaleString()} · {tool.peakDate ? fmtDay(tool.peakDate) : "—"}
          </p>
        </div>
      </div>

      {/* Comparison chart */}
      <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <GitCompareArrows className="h-4 w-4 text-brand-600" />
            Compare tools — daily views
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => resetCompare(true)}
              aria-label="Reset the comparison to the top 5 tools by views"
              className="rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
            >
              Top 5
            </button>
            <button
              onClick={() => resetCompare(false)}
              aria-label="Clear all tools from the comparison"
              className="rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-ink-300 hover:text-ink-800"
            >
              Clear
            </button>
            <select
              value=""
              onChange={(e) => e.target.value && addCompareTool(e.target.value)}
              aria-label="Add a tool to the comparison"
              className="rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 shadow-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">+ Add a tool…</option>
              {data.tools
                .filter((t) => !compareSlugs.includes(t.slug))
                .map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name} ({t.total.toLocaleString()} views)
                  </option>
                ))}
            </select>
          </div>
        </div>

        {compareTools.length >= 2 && (
          <div className="mt-4">
            <CompareChart tools={compareTools} threshold={data.viewsThreshold} />
          </div>
        )}

        {/* Legend — chips render even with a single selection so the picked
            tool stays visible and removable; growth shown vs last week */}
        {compareTools.length >= 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {compareTools.map((t, ti) => {
              const g = growthMap.get(t.slug);
              return (
                <button
                  key={t.slug}
                  onClick={() => removeCompareTool(t.slug)}
                  title={`Remove ${t.name} from the comparison`}
                  aria-label={`Remove ${t.name} from the comparison`}
                  className="group inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: PALETTE[ti % PALETTE.length] }}
                  />
                  <span className="max-w-[140px] truncate font-semibold text-ink-900">{t.name}</span>
                  <span className="tabular-nums text-ink-500">{t.total.toLocaleString()}</span>
                  <GrowthBadge pct={g?.weekGrowthPct ?? null} />
                  <X className="h-3 w-3 text-ink-300 transition group-hover:text-red-500" />
                </button>
              );
            })}
          </div>
        )}

        {compareTools.length < 2 ? (
          <div className="mt-4 rounded-lg border border-dashed border-ink-300 py-8 text-center text-sm text-ink-400">
            {compareTools.length === 0
              ? "No tools selected for comparison — use “Top 5” or add tools above."
              : "Add at least one more tool to compare daily curves side by side."}
          </div>
        ) : (
          <p className="mt-2 text-xs text-ink-400">
            Hover the chart to compare every tool on the same day. Growth % = today vs same day last
            week. Click a chip to drop that tool from the chart.
          </p>
        )}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <CalendarDays className="h-4 w-4 text-brand-600" />
            {tool.name} — daily views
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-ink-500">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-5 rounded bg-brand-600" /> views
            </span>
            {data.viewsThreshold > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-5 rounded border-t-2 border-dashed border-amber-500" /> threshold
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> spike day
            </span>
          </div>
        </div>

        <div className="mt-4">
          <LineChart tool={tool} threshold={data.viewsThreshold} />
        </div>

        {tool.spikeDates.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-semibold text-amber-800">
              {tool.spikeDates.length} spike day{tool.spikeDates.length === 1 ? "" : "s"} on the chart:
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tool.spikeDates.map((d) => (
                <span
                  key={d}
                  className="rounded-md bg-white px-2 py-1 text-[11px] font-medium text-amber-700 shadow-sm"
                >
                  {fmtDay(d)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Breakdown table */}
      <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
        <h2 className="text-sm font-semibold text-ink-900">All tools — last {data.days} days</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                <th className="pb-2 pr-4 font-semibold">Tool</th>
                <th className="pb-2 pr-4 font-semibold">Views</th>
                <th className="pb-2 pr-4 font-semibold">Daily avg</th>
                <th className="pb-2 pr-4 font-semibold">Peak day</th>
                <th className="pb-2 pr-4 font-semibold">Today</th>
                <th className="pb-2 pr-4 font-semibold">Day Δ</th>
                <th className="pb-2 pr-4 font-semibold">Week Δ</th>
                <th className="pb-2 font-semibold">Spikes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {data.tools.map((t) => {
                const g = growthMap.get(t.slug);
                return (
                  <tr
                    key={t.slug}
                    onClick={() => setSlug(t.slug)}
                    className={`cursor-pointer transition ${
                      t.slug === tool.slug ? "bg-brand-50/60" : "hover:bg-ink-50"
                    }`}
                  >
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-ink-800">{t.name}</p>
                      <p className="text-xs text-ink-400">{t.category}</p>
                    </td>
                    <td className="py-2.5 pr-4 font-semibold text-ink-900">{t.total.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-ink-600">{t.avg.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 text-ink-600">
                      {t.peak > 0 ? `${t.peak.toLocaleString()} · ${fmtDay(t.peakDate)}` : "—"}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold tabular-nums text-ink-900">
                      {g ? g.today.toLocaleString() : "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      <GrowthBadge pct={g?.dayGrowthPct ?? null} />
                    </td>
                    <td className="py-2.5 pr-4">
                      <GrowthBadge pct={g?.weekGrowthPct ?? null} />
                    </td>
                    <td className="py-2.5">
                      {t.spikeDates.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          <Flame className="h-3 w-3" /> {t.spikeDates.length}
                        </span>
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
