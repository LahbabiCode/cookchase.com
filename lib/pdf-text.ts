// Pure helpers for building PDFs with pdf-lib's built-in WinAnsi fonts
// (Helvetica etc.). Shared by lib/result-pdf.ts (generic tool exports) and
// lib/comparison-pdf.ts (recipe comparator). Kept free of DB imports so the
// node test runner can load it directly.

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
  "÷": "/",
  "°": "deg",
  "≈": "~"
};

export function toPdfSafe(text: string): string {
  return Array.from(text)
    .map((ch) => {
      if (PDF_CHAR_MAP[ch]) return PDF_CHAR_MAP[ch];
      const code = ch.charCodeAt(0);
      if (code >= 32 && code <= 126) return ch;
      if (code >= 160 && code <= 255) return ch;
      return "?";
    })
    .join("");
}

/** Clamp a label/name to a display width, adding an ellipsis when truncated. */
export function clampPdfText(text: string, maxLen: number): string {
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

/** "2026-08-03" from any ISO/SQLite datetime string. */
export function pdfDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return (iso || "").slice(0, 10);
  return d.toISOString().slice(0, 10);
}
