// Pure sanitization shared by the result-history and tool-export API routes.
// Free of DB imports so the node test runner can load it directly.

export interface RawRow {
  label?: unknown;
  value?: unknown;
  sub?: unknown;
}

export interface SanitizedRow {
  label: string;
  value: string;
  sub: string;
}

export function clampStr(s: unknown, max: number): string {
  return String(s ?? "").slice(0, max).trim();
}

/**
 * Validate + normalize client-sent result rows: every field becomes a trimmed
 * string capped at a sensible length, rows without any content are dropped,
 * and the total is capped so one request can't bloat the DB.
 */
export function sanitizeRows(rows: unknown, maxRows = 80): SanitizedRow[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => {
      const row = (r ?? {}) as RawRow;
      return {
        label: clampStr(row.label, 120),
        value: clampStr(row.value, 160),
        sub: clampStr(row.sub, 160)
      };
    })
    .filter((r) => r.label || r.value)
    .slice(0, maxRows);
}
