"use client";

import { useState } from "react";
import { FileDown, FileText, Download } from "lucide-react";

const PERIODS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
  { value: "0", label: "All time" }
];

const selectCls =
  "rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

/**
 * Admin report exporter. Standalone (dashboard) it exports the whole active
 * catalog for the chosen period. Pass `categories` and/or `statuses` to render
 * filter dropdowns that narrow the report before download — e.g. from the
 * /admin/tools page, where the admin picks a category and a visibility status.
 */
export default function ReportExporter({
  categories = [],
  statuses = [],
  defaultStatus = "all"
}: {
  /** Optional tool categories offered as a filter. */
  categories?: string[];
  /** Optional statuses ("active"/"hidden") offered as a filter. */
  statuses?: string[];
  /** Initial status selection when `statuses` is provided. */
  defaultStatus?: string;
}) {
  const [days, setDays] = useState("30");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState(defaultStatus);
  const hasFilters = categories.length > 0 || statuses.length > 0;

  const params = new URLSearchParams({ days });
  if (category) params.set("category", category);
  // Only include a status when the caller opted into the filter UI — the plain
  // dashboard export keeps the historical active-tools-only behavior.
  if (statuses.length > 0 && status) params.set("status", status);
  const query = params.toString();

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <FileDown className="h-4 w-4 text-brand-600" />
          Export performance report
        </h2>
        <select
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className={selectCls}
          aria-label="Report period"
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1 text-xs text-ink-400">
        Summarizes views, comments and per-tool performance for the selected
        period. Great for monthly reviews and AdSense progress tracking.
        {hasFilters && " Filters narrow the report to the tools you pick."}
      </p>

      {hasFilters && (
        <div className="mt-3 flex flex-wrap gap-3">
          {statuses.length > 0 && (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={selectCls}
              aria-label="Report status filter"
            >
              <option value="all">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === "active" ? "Active" : s === "hidden" ? "Hidden" : s}
                </option>
              ))}
            </select>
          )}
          {categories.length > 0 && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={selectCls}
              aria-label="Report category filter"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {/* Plain <a>, not next/link — next/link would prefetch the API route
            on hover and generate a report for nothing. */}
        <a
          href={`/api/admin/reports?format=csv&${query}`}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <FileText className="h-4 w-4" />
          Download CSV
        </a>
        <a
          href={`/api/admin/reports?format=pdf&${query}`}
          className="inline-flex items-center gap-2 rounded-md border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 shadow-sm transition hover:border-brand-400 hover:text-brand-700"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </a>
      </div>
    </div>
  );
}
