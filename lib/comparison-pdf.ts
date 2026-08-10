import { getSetting } from "./queries";
import { toPdfSafe, clampPdfText } from "./pdf-text.ts";

/**
 * CookChase — Recipe Comparator PDF export (Pro feature).
 *
 * Renders a simple A4 portrait PDF of a three-way recipe comparison using
 * pdf-lib (same conventions as lib/report.ts): Helvetica fonts, WinAnsi-safe
 * text mapping, brand-accent headers and alternating row shading.
 */

export interface ComparisonRecipe {
  label: string; // "A" | "B" | "C"
  name: string;
  servings: number;
  totalTime: number;
  cost: number;
  perServing: number;
  per: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  estimatedCount: number;
}

export interface ComparisonMetric {
  label: string;
  tip: string;
  values: string[]; // one formatted value per recipe, in A/B/C order
  win: number | null; // index of the winner, or null for a tie / note row
}

export interface ComparisonPdfData {
  siteName: string;
  generatedAt: string;
  recipes: ComparisonRecipe[];
  metrics: ComparisonMetric[];
  summary: string; // e.g. "Recipe A wins 5 categories vs 2."
}

// ---- Layout ------------------------------------------------------------------

const PAGE_W = 595.28; // A4 portrait points
const PAGE_H = 841.89;
const MARGIN = 42;
const CONTENT_W = PAGE_W - MARGIN * 2;

const ACCENT = [0.933, 0.443, 0.243] as const; // brand amber-orange
const ALT_ROW = [0.973, 0.957, 0.937] as const;

const RECIPE_COLORS = [
  [0.216, 0.447, 0.91] as const, // Recipe A — brand blue
  [0.949, 0.686, 0.125] as const, // Recipe B — amber
  [0.196, 0.655, 0.49] as const // Recipe C — emerald
];

/** Build the comparison PDF bytes. */
export async function buildComparisonPdf(
  data: ComparisonPdfData
): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const doc = await PDFDocument.create();
  doc.setTitle(`${data.siteName} — Recipe Comparison`);
  doc.setProducer("CookChase");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN - 8;

  const ink = rgb(0.13, 0.13, 0.15);
  const muted = rgb(0.42, 0.42, 0.45);
  const white = rgb(1, 1, 1);
  const accent = rgb(ACCENT[0], ACCENT[1], ACCENT[2]);
  const altRowBg = rgb(ALT_ROW[0], ALT_ROW[1], ALT_ROW[2]);

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN - 8;
    }
  };

  // Draws at the current cursor `y` unless opts.y overrides it (used for the
  // multi-line summary cards, where each line needs its own baseline).
  const drawText = (
    text: string,
    x: number,
    size: number,
    opts: { bold?: boolean; color?: ReturnType<typeof rgb>; y?: number } = {}
  ) => {
    page.drawText(toPdfSafe(text), {
      x,
      y: opts.y ?? y,
      size,
      font: opts.bold ? fontBold : font,
      color: opts.color ?? ink
    });
  };

  // --- Header ---------------------------------------------------------------
  drawText(data.siteName, MARGIN, 22, { bold: true, color: accent });
  y -= 16;
  drawText("Recipe comparison", MARGIN, 15, { bold: true });
  y -= 15;
  drawText(
    `Generated: ${new Date(data.generatedAt).toISOString().slice(0, 10)}`,
    MARGIN,
    9,
    { color: muted }
  );
  y -= 16;

  // --- Recipe summary cards ---------------------------------------------------
  const cardGap = 10;
  const cardW = (CONTENT_W - cardGap * 2) / 3;
  const cardH = 104;
  data.recipes.forEach((r, i) => {
    const color = rgb(RECIPE_COLORS[i][0], RECIPE_COLORS[i][1], RECIPE_COLORS[i][2]);
    const x = MARGIN + i * (cardW + cardGap);
    page.drawRectangle({
      x,
      y: y - cardH,
      width: cardW,
      height: cardH,
      color: rgb(0.97, 0.96, 0.94),
      borderColor: color,
      borderWidth: 1
    });
    // Label chip
    page.drawRectangle({
      x: x + 8,
      y: y - 22,
      width: 18,
      height: 12,
      color
    });
    drawText(r.label, x + 12, 8, { bold: true, color: white });
    const name = clampPdfText(r.name, 24);
    drawText(name, x + 30, 9, { bold: true });
    const lines: [string, string][] = [
      ["Servings", String(r.servings)],
      ["Total time", `${r.totalTime} min`],
      ["Cost", `$${r.cost.toFixed(2)}`],
      ["Per serving", `$${r.perServing.toFixed(2)}`],
      ["Calories", `${Math.round(r.per.kcal)} kcal`],
      ["Protein", `${r.per.protein.toFixed(1)} g`]
    ];
    // Each stat line gets its own baseline via opts.y — the module-level `y`
    // cursor stays fixed so the three cards stay aligned on one row.
    let ly = y - 38;
    for (const [label, value] of lines) {
      drawText(label, x + 8, 7.5, { color: muted, y: ly });
      drawText(value, x + cardW - 8, 7.5, { bold: true, color: ink, y: ly });
      ly -= 10.5;
    }
    if (r.estimatedCount > 0) {
      drawText(`${r.estimatedCount} price(s) estimated`, x + 8, 6.5, { color: muted, y: ly + 2 });
    }
  });
  y -= cardH + 20;

  // --- Metrics table ----------------------------------------------------------
  const colW = CONTENT_W / (data.metrics.length ? 3 : 1);
  const metricCols = ["Recipe A", "Recipe B", "Recipe C"];

  const drawMetricsHeader = () => {
    ensureSpace(30);
    page.drawRectangle({
      x: MARGIN,
      y: y - 16,
      width: CONTENT_W,
      height: 16,
      color: rgb(ACCENT[0], ACCENT[1], ACCENT[2])
    });
    drawText("Metric", MARGIN + 5, 8, { bold: true, color: white });
    metricCols.forEach((h, i) => {
      drawText(h, MARGIN + 5 + (i + 1) * colW, 8, { bold: true, color: white });
    });
    y -= 16;
  };

  drawMetricsHeader();

  const rowH = 16;
  data.metrics.forEach((m, idx) => {
    ensureSpace(rowH + 4);
    if (idx % 2 === 1) {
      page.drawRectangle({
        x: MARGIN,
        y: y - rowH,
        width: CONTENT_W,
        height: rowH,
        color: altRowBg
      });
    }
    // Winner column gets a subtle highlight + the label is bolded.
    const winColor =
      m.win !== null ? rgb(RECIPE_COLORS[m.win][0], RECIPE_COLORS[m.win][1], RECIPE_COLORS[m.win][2]) : null;
    if (winColor && m.win !== null) {
      // Light tint of the winner's color that PRESERVES its hue: move each
      // channel 35% toward white instead of adding a flat offset, so an amber
      // winner reads amber and an emerald winner reads emerald.
      const tint = (c: number) => Math.min(0.99, 1 - (1 - c) * 0.35);
      page.drawRectangle({
        x: MARGIN + (m.win + 1) * colW,
        y: y - rowH,
        width: colW,
        height: rowH,
        color: rgb(tint(RECIPE_COLORS[m.win][0]), tint(RECIPE_COLORS[m.win][1]), tint(RECIPE_COLORS[m.win][2]))
      });
    }
    const label = clampPdfText(m.label, 22);
    drawText(label, MARGIN + 5, 8, {
      bold: m.win !== null,
      color: m.win !== null ? ink : muted
    });
    m.values.forEach((v, i) => {
      drawText(toPdfSafe(v), MARGIN + 5 + (i + 1) * colW, 8, {
        bold: m.win === i,
        color: m.win === i && winColor ? winColor : ink
      });
    });
    y -= rowH;
  });

  // --- Summary line -----------------------------------------------------------
  ensureSpace(26);
  y -= 8;
  drawText(`Result: ${toPdfSafe(data.summary)}`, MARGIN, 9.5, {
    bold: true,
    color: accent
  });
  y -= 16;

  // --- Footer ------------------------------------------------------------------
  ensureSpace(24);
  drawText(
    `${toPdfSafe(data.siteName)}  ·  Recipe comparator — free export`,
    MARGIN,
    7,
    { color: muted }
  );

  return doc.save();
}

/** Convenience: builds the site name from settings (used by the API route). */
export function comparisonSiteName(): string {
  return getSetting("site_name") || "CookChase";
}
