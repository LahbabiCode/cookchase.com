import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Search, ArrowRight } from "lucide-react";
import {
  searchAll,
  getSiteUrl,
  getToolCategories,
  getArticleCategories
} from "@/lib/queries";
import { ToolIcon } from "@/lib/icons";
import Highlight from "@/components/Highlight";
import SearchFilters from "@/components/SearchFilters";

export const dynamic = "force-dynamic";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: false },
  alternates: { canonical: `${siteUrl}/search` }
};

export default async function SearchPage({
  searchParams
}: {
  searchParams: { q?: string; type?: string; category?: string; sort?: string };
}) {
  const q = (searchParams.q || "").trim().slice(0, 100);
  const type =
    searchParams.type === "tools" || searchParams.type === "articles"
      ? searchParams.type
      : "all";
  const category = (searchParams.category || "").trim().slice(0, 60);
  const sort = searchParams.sort === "popular" ? "popular" : "relevance";

  const { tools, articles } = q
    ? searchAll(q, 40, 40, { type, category, sort })
    : { tools: [], articles: [] };
  const total = tools.length + articles.length;

  const toolCategories = getToolCategories().map((c) => c.category);
  const articleCategories = getArticleCategories();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-ink-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-600">Search</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-900">
        {q ? (
          <>
            Search results for{" "}
            <span className="text-brand-600">“{q}”</span>
          </>
        ) : (
          "Search"
        )}
      </h1>
      {q && (
        <p className="mt-2 text-sm text-ink-500">
          {total > 0
            ? `Found ${total} match${total === 1 ? "" : "es"}${type !== "all" ? ` in ${type}` : ""}${category ? ` in ${category}` : ""}${sort === "popular" ? ", sorted by popularity" : ""}.`
            : "No matches found."}
        </p>
      )}

      {q && (
        <SearchFilters
          toolCategories={toolCategories}
          articleCategories={articleCategories}
        />
      )}

      {!q ? (
        <div className="mt-10 rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center">
          <Search className="mx-auto h-10 w-10 text-ink-300" />
          <p className="mt-4 text-ink-500">
            Type a keyword above — try “timer”, “cost”, “meal” or “substitute” to find tools and
            articles.
          </p>
          <Link
            href="/tools"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Browse all tools
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : total === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-ink-800">No results for “{q}”</p>
          <p className="mt-2 text-sm text-ink-500">
            Try a different keyword, or explore our popular tools and cooking guides.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {["egg timer", "meal", "cost", "substitute"].map((s) => (
              <Link
                key={s}
                href={`/search?q=${encodeURIComponent(s)}`}
                className="rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-sm text-ink-600 transition hover:border-brand-400 hover:text-brand-600"
              >
                {s}
              </Link>
            ))}
          </div>
          <Link
            href="/tools"
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800"
          >
            Browse all tools
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {tools.length > 0 && (
            <section aria-labelledby="tools-heading">
              <h2
                id="tools-heading"
                className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-400"
              >
                Tools ({tools.length})
              </h2>
              <ul className="divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-200 bg-white">
                {tools.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/tools/${t.slug}`}
                      className="group flex items-start gap-4 p-4 transition hover:bg-brand-50/60"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                        <ToolIcon name={t.icon} className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink-900 group-hover:text-brand-700">
                            <Highlight text={t.name} query={q} />
                          </span>
                          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-500">
                            {t.category}
                          </span>
                        </span>
                        <span className="mt-1 block truncate text-sm text-ink-500">
                          <Highlight text={t.tagline} query={q} />
                        </span>
                      </span>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {articles.length > 0 && (
            <section aria-labelledby="articles-heading">
              <h2
                id="articles-heading"
                className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-400"
              >
                Articles ({articles.length})
              </h2>
              <ul className="divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-200 bg-white">
                {articles.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/blog/${a.slug}`}
                      className="group flex items-start gap-4 p-4 transition hover:bg-brand-50/60"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-500">
                        <FileText className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink-900 group-hover:text-brand-700">
                            <Highlight text={a.title} query={q} />
                          </span>
                          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-500">
                            {a.category}
                          </span>
                        </span>
                        <span className="mt-1 line-clamp-2 text-sm text-ink-500">
                          <Highlight text={a.excerpt} query={q} />
                        </span>
                      </span>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-center text-xs text-ink-400">
            <Link href={`${siteUrl}/tools?q=${encodeURIComponent(q)}`} className="hover:text-brand-600">
              Tip: filter tools by category on the tools page
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
