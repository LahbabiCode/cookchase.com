import { getDb } from "./db";
import { getSetting, getPendingCommentCount } from "./queries";
import { growthPct, fmtGrowthPct } from "./traffic";

/**
 * CookChase — admin reports.
 *
 * Aggregates views, comments and per-tool performance into a flat dataset,
 * then renders it as CSV (dependency-free) or PDF (pdf-lib).
 */

export interface ToolRow {
  slug: string;
  name: string;
  category: string;
  views_all: number;
  views_period: number;
  /** Views in the same-length window immediately before the report period. */
  views_prev: number;
  /** % change of period views vs the previous period (null = no baseline). */
  views_growth: number | null;
  comments_all: number;
  comments_period: number;
  /** Comments in the same-length window immediately before the period. */
  comments_prev: number;
  /** % change of period comments vs the previous period (null = no baseline). */
  comments_growth: number | null;
  score: number;
}

export interface ReportData {
  siteName: string;
  siteUrl: string;
  generatedAt: string;
  days: number; // 0 = all time
  periodLabel: string;
  /** Human-readable summary of the active filters ("" = whole catalog). */
  filterLabel: string;
  totals: {
    views_all: number;
    views_period: number;
    views_prev: number;
    views_growth: number | null;
    comments_all: number;
    comments_period: number;
    comments_prev: number;
    comments_growth: number | null;
    pending_comments: number;
    active_tools: number;
    tools_with_views: number;
  };
  tools: ToolRow[];
}

/**
 * Filters for a report — both optional.
 * - `category`: exact match on the tools.category column.
 * - `status`: "active" (default), "hidden", or "all" (active + hidden).
 */
export interface ReportFilter {
  category?: string;
  status?: "active" | "hidden" | "all";
}

/**
 * A fixed calendar range (e.g. the previous month for the emailed report).
 * When provided, it overrides the rolling day-window so the report covers
 * exactly the days the admin wants ("July 2026", not "last 30 days").
 */
export interface ReportPeriod {
  startIso: string; // inclusive, YYYY-MM-DD
  endIso: string; // inclusive, YYYY-MM-DD
  label: string; // human label, e.g. "July 2026"
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Shift a YYYY-MM-DD date by `n` days (UTC). Negative shifts go backwards. */
function addDaysIso(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function buildReportData(
  days: number,
  filter?: ReportFilter,
  period?: ReportPeriod
): ReportData {
  const db = getDb();
  // A fixed calendar period overrides the rolling window; `days` then only
  // matters as the fallback (and for the periodLabel when no period is given).
  const today = period?.endIso ?? todayIso();
  const start =
    period?.startIso ?? (days > 0 ? daysAgoIso(days) : "0000-01-01");

  const periodLabel =
    period?.label ??
    (days <= 0
      ? "All time"
      : days === 1
        ? "Last 24 hours"
        : `Last ${days} days`);

  // Previous-period window: the same-length block of days immediately before
  // the report period, used to compute growth %. All-time reports (days = 0)
  // have no previous period — growth stays null there.
  let prevStart = "";
  let prevEnd = "";
  if (days > 0) {
    const spanMs =
      Date.parse(today + "T00:00:00Z") - Date.parse(start + "T00:00:00Z");
    const spanDays = Math.max(1, Math.round(spanMs / 86400000) + 1);
    prevEnd = addDaysIso(start, -1);
    prevStart = addDaysIso(prevEnd, -(spanDays - 1));
  }
  const hasPrev = prevStart !== "";

  // The tools table drives the report. Default = active tools only (the
  // classic report); "hidden" and "all" widen the net. A category narrows it.
  // Totals and rows are scoped to this set, so a filtered export summarizes
  // exactly the tools it lists.
  const toolsSql =
    "SELECT slug, name, category, status FROM tools";
  const where: string[] = [];
  const toolParams: (string | number)[] = [];
  if (filter?.category && filter.category.trim()) {
    where.push("category = ?");
    toolParams.push(filter.category.trim());
  }
  const status = filter?.status ?? "active";
  if (status !== "all") {
    where.push("status = ?");
    toolParams.push(status);
  }
  const toolsSqlFinal =
    toolsSql +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    " ORDER BY sort_order ASC, name ASC";
  const tools = db.prepare(toolsSqlFinal).all(...toolParams) as {
    slug: string;
    name: string;
    category: string;
    status: string;
  }[];
  const toolSlugs = new Set(tools.map((t) => t.slug));

  // A report is "narrowed" when the caller asked for a subset (category or a
  // non-default status). Narrowed reports list every matching tool — even with
  // zero activity — so the export doubles as a complete inventory.
  const narrowed =
    Boolean(filter?.category && filter.category.trim()) || status !== "active";

  const filterParts: string[] = [];
  if (filter?.category && filter.category.trim()) {
    filterParts.push(`Category: ${filter.category.trim()}`);
  }
  if (status !== "active") {
    filterParts.push(status === "all" ? "Status: all statuses" : `Status: ${status}`);
  }
  const filterLabel = filterParts.join(" · ");

  // Per-tool period views (article views live under the 'blog:' prefix in the
  // same table — exclude them so the report stays tool-focused).
  const periodViews = db
    .prepare(
      "SELECT slug, SUM(views) as total FROM analytics WHERE date >= ? AND date <= ? AND slug NOT LIKE 'blog:%' GROUP BY slug"
    )
    .all(start, today) as { slug: string; total: number }[];
  // Per-tool all-time views
  const allViews = db
    .prepare(
      "SELECT slug, SUM(views) as total FROM analytics WHERE slug NOT LIKE 'blog:%' GROUP BY slug"
    )
    .all() as { slug: string; total: number }[];
  // Per-tool approved comments (top-level visitor comments) — all-time.
  const toolCommentsAll = db
    .prepare(
      `SELECT page_slug as slug, COUNT(*) as total FROM comments
       WHERE page_type = 'tool' AND approved = 1 AND parent_id = 0
       GROUP BY page_slug`
    )
    .all() as { slug: string; total: number }[];
  // Per-tool approved comments scoped to the selected period.
  const toolCommentsPeriod = db
    .prepare(
      `SELECT page_slug as slug, COUNT(*) as total FROM comments
       WHERE page_type = 'tool' AND approved = 1 AND parent_id = 0
         AND date(created_at) >= ? AND date(created_at) <= ?
       GROUP BY page_slug`
    )
    .all(start, today) as { slug: string; total: number }[];
  // Previous-period views and approved comments (for the growth columns).
  const prevViews = hasPrev
    ? (db
        .prepare(
          "SELECT slug, SUM(views) as total FROM analytics WHERE date >= ? AND date <= ? AND slug NOT LIKE 'blog:%' GROUP BY slug"
        )
        .all(prevStart, prevEnd) as { slug: string; total: number }[])
    : [];
  const prevComments = hasPrev
    ? (db
        .prepare(
          `SELECT page_slug as slug, COUNT(*) as total FROM comments
           WHERE page_type = 'tool' AND approved = 1 AND parent_id = 0
             AND date(created_at) >= ? AND date(created_at) <= ?
           GROUP BY page_slug`
        )
        .all(prevStart, prevEnd) as { slug: string; total: number }[])
    : [];
  const viewsPeriodMap = new Map(periodViews.map((r) => [r.slug, r.total]));
  const viewsAllMap = new Map(allViews.map((r) => [r.slug, r.total]));
  const viewsPrevMap = new Map(prevViews.map((r) => [r.slug, r.total]));
  const commentsAllMap = new Map(toolCommentsAll.map((r) => [r.slug, r.total]));
  const commentsPeriodMap = new Map(toolCommentsPeriod.map((r) => [r.slug, r.total]));
  const commentsPrevMap = new Map(prevComments.map((r) => [r.slug, r.total]));

  // Totals are scoped to the report's tool set so a filtered export never
  // mixes in tools it doesn't list (or stale analytics rows from deleted ones).
  let viewsAll = 0;
  let viewsPeriod = 0;
  for (const v of allViews) if (toolSlugs.has(v.slug)) viewsAll += v.total;
  for (const v of periodViews) if (toolSlugs.has(v.slug)) viewsPeriod += v.total;

  const toolsWithViews = Array.from(toolSlugs).filter((s) => viewsAllMap.has(s)).length;
  const activeTools = tools.length;
  // Tool-scoped comment totals (consistent with the per-tool rows below).
  let commentsAll = 0;
  let commentsPeriod = 0;
  for (const c of toolCommentsAll) if (toolSlugs.has(c.slug)) commentsAll += c.total;
  for (const c of toolCommentsPeriod) if (toolSlugs.has(c.slug)) commentsPeriod += c.total;
  // Previous-period totals, scoped to the same tool set.
  let viewsPrev = 0;
  let commentsPrev = 0;
  for (const v of prevViews) if (toolSlugs.has(v.slug)) viewsPrev += v.total;
  for (const c of prevComments) if (toolSlugs.has(c.slug)) commentsPrev += c.total;
  const pendingComments = getPendingCommentCount();

  // Default reports keep only tools with any activity; narrowed reports list
  // every matching tool so the export works as a full inventory.
  const rows: ToolRow[] = tools
    .map((t) => {
      const viewsAllT = viewsAllMap.get(t.slug) ?? 0;
      const viewsPeriodT = viewsPeriodMap.get(t.slug) ?? 0;
      const viewsPrevT = viewsPrevMap.get(t.slug) ?? 0;
      const commentsAllT = commentsAllMap.get(t.slug) ?? 0;
      const commentsPeriodT = commentsPeriodMap.get(t.slug) ?? 0;
      const commentsPrevT = commentsPrevMap.get(t.slug) ?? 0;
      return {
        slug: t.slug,
        name: t.name,
        category: t.category,
        views_all: viewsAllT,
        views_period: viewsPeriodT,
        views_prev: viewsPrevT,
        views_growth: growthPct(viewsPeriodT, viewsPrevT),
        comments_all: commentsAllT,
        comments_period: commentsPeriodT,
        comments_prev: commentsPrevT,
        comments_growth: growthPct(commentsPeriodT, commentsPrevT),
        score: viewsAllT + commentsAllT * 25
      };
    })
    .filter(
      (r) =>
        narrowed ||
        r.views_all > 0 ||
        r.views_period > 0 ||
        r.comments_all > 0
    )
    .sort((a, b) => b.views_period - a.views_period || b.score - a.score);

  return {
    siteName: getSetting("site_name") || "CookChase",
    siteUrl: getSetting("site_url") || "https://cookchase.com",
    generatedAt: new Date().toISOString(),
    days,
    periodLabel,
    filterLabel,
    totals: {
      views_all: viewsAll,
      views_period: viewsPeriod,
      views_prev: viewsPrev,
      views_growth: growthPct(viewsPeriod, viewsPrev),
      comments_all: commentsAll,
      comments_period: commentsPeriod,
      comments_prev: commentsPrev,
      comments_growth: growthPct(commentsPeriod, commentsPrev),
      pending_comments: pendingComments,
      active_tools: activeTools,
      tools_with_views: toolsWithViews
    },
    tools: rows
  };
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

function csvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvLine(cells: (string | number)[]): string {
  return cells.map(csvCell).join(",") + "\n";
}

/**
 * Two-section CSV: a summary block, then the per-tool table.
 * UTF-8 BOM is included so Excel opens it correctly.
 */
export function buildReportCsv(data: ReportData): string {
  let out = "\uFEFF";
  out += csvLine([`${data.siteName} — Performance report`]);
  out += csvLine(["Generated", new Date(data.generatedAt).toISOString()]);
  out += csvLine(["Period", data.periodLabel]);
  if (data.filterLabel) out += csvLine(["Filter", data.filterLabel]);
  out += csvLine([]);
  out += csvLine(["Summary"]);
  out += csvLine(["Metric", "Value"]);
  out += csvLine(["Views (period)", data.totals.views_period]);
  out += csvLine(["Views (previous period)", data.totals.views_prev]);
  out += csvLine(["Views growth", fmtGrowthPct(data.totals.views_growth)]);
  out += csvLine(["Views (all-time)", data.totals.views_all]);
  out += csvLine(["Comments (period)", data.totals.comments_period]);
  out += csvLine(["Comments (previous period)", data.totals.comments_prev]);
  out += csvLine(["Comments growth", fmtGrowthPct(data.totals.comments_growth)]);
  out += csvLine(["Approved comments", data.totals.comments_all]);
  out += csvLine(["Pending comments", data.totals.pending_comments]);
  out += csvLine(["Tools in report", data.totals.active_tools]);
  out += csvLine(["Tools with views", data.totals.tools_with_views]);
  out += csvLine([]);
  out += csvLine(["Per-tool performance"]);
  out += csvLine([
    "Tool",
    "Slug",
    "Category",
    "Views (period)",
    "Views (previous)",
    "Views Δ",
    "Views (all-time)",
    "Comments (period)",
    "Comments (previous)",
    "Comments Δ",
    "Comments (all-time)",
    "Engagement score"
  ]);
  for (const t of data.tools) {
    out += csvLine([
      t.name,
      t.slug,
      t.category,
      t.views_period,
      t.views_prev,
      fmtGrowthPct(t.views_growth),
      t.views_all,
      t.comments_period,
      t.comments_prev,
      fmtGrowthPct(t.comments_growth),
      t.comments_all,
      t.score
    ]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// PDF (pdf-lib)
// ---------------------------------------------------------------------------

const PAGE_W = 595.28; // A4 portrait points
const PAGE_H = 841.89;
const MARGIN = 42;
const CONTENT_W = PAGE_W - MARGIN * 2;

/**
 * Standard PDF fonts (Helvetica) only support WinAnsi. Tool names and
 * categories are admin-editable, so any unicode could reach the PDF.
 * Map the common kitchen-symbols/typographic chars to safe ASCII and drop
 * anything else to "?" — never let a glyph crash the export.
 */
const PDF_CHAR_MAP: Record<string, string> = {
  "↔": "<->",
  "←": "<-",
  "→": "->",
  "↑": "^",
  "↓": "v",
  "±": "+",
  "—": "-",
  "–": "-",
  "…": "...",
  "•": "-",
  "‘": "'",
  "’": "'",
  "“": '"',
  "”": '"',
  "×": "x",
  "°": "deg"
};

function toPdfSafe(text: string): string {
  return Array.from(text)
    .map((ch) => {
      if (PDF_CHAR_MAP[ch]) return PDF_CHAR_MAP[ch];
      const code = ch.charCodeAt(0);
      // WinAnsi printable range (basic latin + latin-1, minus the C1 controls).
      if (code >= 32 && code <= 126) return ch;
      if (code >= 160 && code <= 255) return ch;
      return "?";
    })
    .join("");
}

// Column widths rebalanced to fit the two extra growth columns. The Δ (delta)
// glyph is not in the WinAnsi charset, so PDF headers use "chg" while the CSV
// keeps the Unicode "Δ" (it ships with a UTF-8 BOM for Excel).
const COL_WIDTHS = {
  name: 112,
  category: 54,
  vp: 42,
  va: 40,
  vchg: 46,
  cp: 40,
  ca: 40,
  cchg: 46,
  score: 50
};

const BRAND = [0.933, 0.443, 0.243] as const; // brand amber-orange
const ALT_ROW = [0.973, 0.957, 0.937] as const;

/** Build the PDF report bytes. */
export async function buildReportPdf(data: ReportData): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const doc = await PDFDocument.create();
  doc.setTitle(`${data.siteName} — Performance Report`);
  doc.setProducer("CookChase");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN - 8;

  const ink = rgb(0.13, 0.13, 0.15);
  const muted = rgb(0.42, 0.42, 0.45);
  const white = rgb(1, 1, 1);
  const accent = rgb(0.933, 0.443, 0.243);
  const headerBg = rgb(BRAND[0], BRAND[1], BRAND[2]);
  const altRowBg = rgb(ALT_ROW[0], ALT_ROW[1], ALT_ROW[2]);

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN - 8;
    }
  };

  const drawText = (
    text: string,
    x: number,
    size: number,
    opts: { bold?: boolean; color?: ReturnType<typeof rgb> } = {}
  ) => {
    page.drawText(toPdfSafe(text), {
      x,
      y,
      size,
      font: opts.bold ? fontBold : font,
      color: opts.color ?? ink
    });
  };

  // --- Header ---------------------------------------------------------------
  drawText(data.siteName, MARGIN, 22, { bold: true, color: accent });
  y -= 16;
  drawText("Performance report", MARGIN, 15, { bold: true });
  y -= 15;
  drawText(
    `Period: ${data.periodLabel}   ·   Generated: ${new Date(
      data.generatedAt
    ).toISOString().slice(0, 10)}`,
    MARGIN,
    9,
    { color: muted }
  );
  if (data.filterLabel) {
    y -= 13;
    drawText(`Filter: ${data.filterLabel}`, MARGIN, 9, { color: muted });
  }
  y -= 13;
  drawText(
    "Growth: % change vs the previous period (views & comments)",
    MARGIN,
    8,
    { color: muted }
  );
  y -= 12;

  // --- Summary cards --------------------------------------------------------
  const cardItems: [string, string][] = [
    ["Views (period)", data.totals.views_period.toLocaleString()],
    ["Views (all-time)", data.totals.views_all.toLocaleString()],
    ["Comments (period)", data.totals.comments_period.toLocaleString()],
    ["Comments (all-time)", data.totals.comments_all.toLocaleString()]
  ];
  const cardGap = 10;
  const cardW = (CONTENT_W - cardGap * 3) / 4;
  const cardH = 44;
  cardItems.forEach(([label, value], i) => {
    const x = MARGIN + i * (cardW + cardGap);
    page.drawRectangle({
      x,
      y: y - cardH,
      width: cardW,
      height: cardH,
      color: rgb(0.97, 0.96, 0.94),
      borderColor: rgb(0.9, 0.88, 0.85),
      borderWidth: 1
    });
    page.drawText(toPdfSafe(value), { x: x + 10, y: y - 30, size: 13, font: fontBold, color: ink });
    page.drawText(toPdfSafe(label), { x: x + 10, y: y - 17, size: 7.5, font, color: muted });
  });
  y -= cardH + 20;

  // --- Tools table header -----------------------------------------------------
  const colX = {
    name: MARGIN,
    category: MARGIN + COL_WIDTHS.name,
    vp: MARGIN + COL_WIDTHS.name + COL_WIDTHS.category,
    va: MARGIN + COL_WIDTHS.name + COL_WIDTHS.category + COL_WIDTHS.vp,
    vchg:
      MARGIN +
      COL_WIDTHS.name +
      COL_WIDTHS.category +
      COL_WIDTHS.vp +
      COL_WIDTHS.va,
    cp:
      MARGIN +
      COL_WIDTHS.name +
      COL_WIDTHS.category +
      COL_WIDTHS.vp +
      COL_WIDTHS.va +
      COL_WIDTHS.vchg,
    ca:
      MARGIN +
      COL_WIDTHS.name +
      COL_WIDTHS.category +
      COL_WIDTHS.vp +
      COL_WIDTHS.va +
      COL_WIDTHS.vchg +
      COL_WIDTHS.cp,
    cchg:
      MARGIN +
      COL_WIDTHS.name +
      COL_WIDTHS.category +
      COL_WIDTHS.vp +
      COL_WIDTHS.va +
      COL_WIDTHS.vchg +
      COL_WIDTHS.cp +
      COL_WIDTHS.ca,
    score: PAGE_W - MARGIN - COL_WIDTHS.score
  };

  const drawTableHeader = () => {
    ensureSpace(30);
    page.drawRectangle({
      x: MARGIN,
      y: y - 16,
      width: CONTENT_W,
      height: 16,
      color: headerBg
    });
    const headers: [string, number][] = [
      ["Tool", colX.name],
      ["Category", colX.category],
      ["V period", colX.vp],
      ["V all", colX.va],
      ["V chg", colX.vchg],
      ["C period", colX.cp],
      ["C all", colX.ca],
      ["C chg", colX.cchg],
      ["Score", colX.score]
    ];
    for (const [h, hx] of headers) {
      drawText(h, hx + 5, 8, { bold: true, color: white });
    }
    y -= 16;
  };

  drawTableHeader();

  // --- Rows ------------------------------------------------------------------
  const rows = data.tools.length ? data.tools : [];
  const rowH = 15;
  let lastPage = page;
  rows.forEach((t, i) => {
    // Space check BEFORE every row (not just odd ones) so even rows can't
    // overflow the bottom margin.
    ensureSpace(rowH + 4);
    // If a page break just happened, repeat the column header on the new page.
    if (page !== lastPage) {
      drawTableHeader();
      lastPage = page;
    }
    if (i % 2 === 1) {
      page.drawRectangle({
        x: MARGIN,
        y: y - rowH,
        width: CONTENT_W,
        height: rowH,
        color: altRowBg
      });
    }
    // Growth cells are colored: green for up, red for down, muted for "—".
    // Null (no previous baseline) renders as "n/a" so a lone "-" can't be
    // skimmed as a negative value.
    const growthColor = (pct: number | null) =>
      pct === null || pct === 0
        ? muted
        : pct > 0
          ? rgb(0.05, 0.5, 0.27)
          : rgb(0.78, 0.18, 0.16);
    const growthText = (pct: number | null) =>
      pct === null ? "n/a" : fmtGrowthPct(pct);
    const name = t.name.length > 26 ? `${t.name.slice(0, 25)}…` : t.name;
    drawText(name, colX.name + 5, 8.5);
    drawText(t.category, colX.category + 5, 7.5, { color: muted });
    drawText(t.views_period.toLocaleString(), colX.vp + 5, 8, { bold: true });
    drawText(t.views_all.toLocaleString(), colX.va + 5, 8);
    drawText(growthText(t.views_growth), colX.vchg + 5, 7.5, {
      color: growthColor(t.views_growth)
    });
    drawText(String(t.comments_period), colX.cp + 5, 8);
    drawText(String(t.comments_all), colX.ca + 5, 8);
    drawText(growthText(t.comments_growth), colX.cchg + 5, 7.5, {
      color: growthColor(t.comments_growth)
    });
    drawText(t.score.toLocaleString(), colX.score + 5, 8, { color: accent });
    y -= rowH;
  });

  if (rows.length === 0) {
    ensureSpace(24);
    drawText("No tool activity in this period yet.", MARGIN, 10, { color: muted });
  }

  // --- Footer -----------------------------------------------------------------
  ensureSpace(24);
  drawText(`${data.siteUrl}  ·  Admin performance report`, MARGIN, 7, {
    color: muted
  });

  return doc.save();
}
