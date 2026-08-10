import { toPdfSafe, clampPdfText, pdfDate } from "./pdf-text.ts";

/**
 * CookChase — generic tool-results PDF export (Pro feature).
 *
 * Renders a clean A4 portrait PDF of any tool's calculated results. Tools
 * post their rows (label + value, optional sub-label) and this builder turns
 * them into a printable document, reusing the same pdf-lib conventions as
 * lib/comparison-pdf.ts (WinAnsi-safe Helvetica, brand-accent header,
 * alternating row shading, pagination).
 */

export interface ResultRowData {
  label: string;
  value: string;
  sub?: string;
}

export interface ResultsPdfData {
  siteName: string;
  generatedAt: string;
  toolName: string;
  toolSlug?: string;
  rows: ResultRowData[];
}

const PAGE_W = 595.28; // A4 portrait points
const PAGE_H = 841.89;
const MARGIN = 42;
const CONTENT_W = PAGE_W - MARGIN * 2;

const ACCENT = [0.933, 0.443, 0.243] as const; // brand amber-orange
const ALT_ROW = [0.973, 0.957, 0.937] as const;

export async function buildResultsPdf(data: ResultsPdfData): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const doc = await PDFDocument.create();
  doc.setTitle(`${data.toolName} — ${data.siteName}`);
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
  drawText(clampPdfText(data.toolName, 60), MARGIN, 15, { bold: true });
  y -= 15;
  drawText(`Generated: ${pdfDate(data.generatedAt)}`, MARGIN, 9, { color: muted });
  y -= 20;

  // --- Results table --------------------------------------------------------
  const colLabelW = CONTENT_W * 0.4;
  const colValueW = CONTENT_W * 0.6;

  const drawHeader = () => {
    ensureSpace(28);
    page.drawRectangle({
      x: MARGIN,
      y: y - 16,
      width: CONTENT_W,
      height: 16,
      color: accent
    });
    drawText("Result", MARGIN + 5, 8, { bold: true, color: white });
    drawText("Value", MARGIN + 5 + colLabelW, 8, { bold: true, color: white });
    y -= 16;
  };

  drawHeader();

  const rowH = 18;
  const rows = data.rows.slice(0, 120);
  if (rows.length === 0) {
    ensureSpace(24);
    drawText("No results to show.", MARGIN, 10, { color: muted });
    y -= 24;
  }
  rows.forEach((row, idx) => {
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
    const label = clampPdfText(row.label, 48);
    drawText(label, MARGIN + 5, 8, { bold: true, color: ink });
    const value = clampPdfText(row.value, 60);
    drawText(value, MARGIN + 5 + colLabelW, 8, {
      bold: true,
      color: accent
    });
    y -= rowH;
    if (row.sub) {
      ensureSpace(14);
      const sub = clampPdfText(row.sub, 90);
      drawText(sub, MARGIN + 5, 6.5, { color: muted });
      y -= 12;
    }
  });

  // --- Footer ----------------------------------------------------------------
  ensureSpace(24);
  drawText(
    `${toPdfSafe(data.siteName)}  ·  ${clampPdfText(data.toolName, 40)} — free export`,
    MARGIN,
    7,
    { color: muted }
  );

  return doc.save();
}
