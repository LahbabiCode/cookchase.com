"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

/**
 * Advanced search filters for /search. Every control writes its choice back
 * to the URL (?q=…&type=…&category=…&sort=…) so filter combinations are
 * shareable, bookmarkable and survive reloads — no client state required.
 */
export default function SearchFilters({
  toolCategories,
  articleCategories
}: {
  toolCategories: string[];
  articleCategories: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const q = params.get("q") || "";
  const typeParam = params.get("type");
  const category = params.get("category") || "";
  const sortParam = params.get("sort");

  const validType = typeParam === "tools" || typeParam === "articles" ? typeParam : "all";
  const validSort = sortParam === "popular" ? "popular" : "relevance";

  // The category dropdown lists tool categories for the mixed/tools view and
  // article categories when the visitor narrows to articles only.
  const categories = validType === "articles" ? articleCategories : toolCategories;

  /** Build the next /search URL from the current params plus one change. */
  function buildUrl(change: { type?: string; category?: string; sort?: string }) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    const nextType = change.type ?? validType;
    const nextSort = change.sort ?? validSort;
    if (nextType !== "all") next.set("type", nextType);
    // When the type changes, drop a category that isn't valid for the new
    // type — otherwise an article category would linger in the tools view
    // (and vice versa) with no matching option in the dropdown.
    let nextCategory =
      change.category !== undefined ? change.category : category;
    if (change.type && nextCategory) {
      const targetList =
        nextType === "articles" ? articleCategories : toolCategories;
      if (!targetList.includes(nextCategory)) nextCategory = "";
    }
    if (nextCategory) next.set("category", nextCategory);
    if (nextSort !== "relevance") next.set("sort", nextSort);
    return `/search?${next.toString()}`;
  }

  const hasFilters = validType !== "all" || category !== "" || validSort !== "relevance";
  const activeCls =
    "rounded-full bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white transition";
  const idleCls =
    "rounded-full bg-ink-100 px-4 py-1.5 text-sm font-semibold text-ink-600 transition hover:bg-brand-50 hover:text-brand-700";
  const selectCls =
    "h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-sm text-ink-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

  return (
    <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 shadow-sm">
      <span className="inline-flex items-center gap-1.5 pl-1 text-xs font-bold uppercase tracking-wider text-ink-400">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
      </span>

      <div className="flex items-center gap-1" role="group" aria-label="Result type">
        {(
          [
            ["all", "All"],
            ["tools", "Tools"],
            ["articles", "Articles"]
          ] as const
        ).map(([value, label]) => (
          <a
            key={value}
            href={buildUrl({ type: value })}
            aria-current={validType === value ? "page" : undefined}
            className={validType === value ? activeCls : idleCls}
          >
            {label}
          </a>
        ))}
      </div>

      <select
        aria-label="Filter by category"
        value={category}
        onChange={(e) => router.push(buildUrl({ category: e.target.value }))}
        className={selectCls}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        aria-label="Sort results"
        value={validSort}
        onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
        className={selectCls}
      >
        <option value="relevance">Best match</option>
        <option value="popular">Most popular</option>
      </select>

      {hasFilters && (
        <a
          href={buildUrl({ type: "all", category: "", sort: "relevance" })}
          className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-ink-500 transition hover:text-ink-800"
        >
          <X className="h-3.5 w-3.5" />
          Clear filters
        </a>
      )}
    </div>
  );
}
