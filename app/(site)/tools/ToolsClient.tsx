"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Tool } from "@/lib/queries";
import ToolCard from "@/components/ToolCard";
import { categoryToSlug } from "@/lib/category-hubs";
import { useLang } from "@/lib/useLang";
import { tCategory } from "@/lib/i18n";

export default function ToolsClient({
  categories,
  tools,
  commentCounts,
  viewsCounts,
  initialCategory,
  initialQuery
}: {
  categories: { category: string; count: number }[];
  tools: Tool[];
  commentCounts: Record<string, number>;
  viewsCounts: Record<string, number>;
  initialCategory: string;
  initialQuery: string;
}) {
  const { lang, t } = useLang();
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    return tools.filter((t) => {
      const matchCat = !category || t.category === category;
      const matchQ =
        !query ||
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.tagline.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  }, [tools, category, query]);

  return (
    <div>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-wrap gap-2">
          <button
            onClick={() => setCategory("")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              category === ""
                ? "border-ink-900 bg-ink-900 text-white"
                : "border-ink-200 bg-white text-ink-600 hover:border-ink-300"
            }`}
          >
            {t("tools.all")}
          </button>
          {categories.map((c) => (
            <button
              key={c.category}
              onClick={() => setCategory(category === c.category ? "" : c.category)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                category === c.category
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 bg-white text-ink-600 hover:border-ink-300"
              }`}
            >
              {tCategory(lang, c.category)}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("tools.searchPlaceholder")}
          className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm shadow-sm transition placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-64"
        />
      </div>

      {category && categoryToSlug(category) && (
        <p className="mt-4 text-sm">
          <Link
            href={`/tools/${categoryToSlug(category)}`}
            className="inline-flex items-center gap-1 font-medium text-brand-700 transition hover:text-brand-800"
          >
            {t("tools.browseGuide", { category: tCategory(lang, category) })}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      )}

      <div className="cv-auto mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tool) => (
          <ToolCard
            key={tool.slug}
            tool={tool}
            commentCount={commentCounts[tool.slug] ?? 0}
            views={viewsCounts[tool.slug] ?? 0}
            lang={lang}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-ink-200 p-10 text-center text-ink-500">
          {t("tools.noneMatched")}
        </div>
      )}
    </div>
  );
}
