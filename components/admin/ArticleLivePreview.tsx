"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, Eye, ExternalLink } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";

export interface PreviewArticle {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  meta_title: string;
  meta_description: string;
  published: number;
  created_at?: string;
}

/**
 * Live preview of the visitor-facing article page, driven by the admin
 * editor's current (unsaved) state. The title, category, excerpt, markdown
 * content and SEO fields update in real time exactly as a visitor would see
 * them on /blog/[slug] — plus a Google search-result preview.
 */
export default function ArticleLivePreview({ article }: { article: PreviewArticle }) {
  const slug = article.slug || "your-article";
  const serpTitle =
    article.meta_title ||
    (article.title
      ? `${article.title} | CookChase`
      : "Your article title | CookChase");
  const serpDesc =
    article.meta_description ||
    article.excerpt ||
    "A short, practical article that makes you a better cook.";
  const titleFallback = !article.meta_title;
  const descFallback = !article.meta_description;

  const date = article.created_at
    ? new Date(article.created_at + "Z").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "";

  const hasContent = article.content.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
          <Eye className="h-4 w-4 text-brand-600" />
          Live preview
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
          Updates as you type
        </span>
      </div>

      {/* Google search result preview */}
      <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-card">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
          Google result preview
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-[9px] font-bold text-white">
            CC
          </span>
          <span className="truncate">cookchase.com › blog › {slug}</span>
        </div>
        <p className="mt-1 cursor-pointer truncate text-[17px] leading-snug text-[#1a0dab] hover:underline">
          {serpTitle}
        </p>
        <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-[#4d5156]">
          {serpDesc}
        </p>
        <p className="mt-1 text-xs text-[#70757a]">
          {article.meta_title.length}/60 · {article.meta_description.length}/160
          characters
          {(titleFallback || descFallback) && (
            <span className="text-amber-600">
              {" "}
              — previewing generated defaults for empty fields
            </span>
          )}
        </p>
      </div>

      {/* Visitor page preview */}
      <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 shadow-inner">
        <div className="rounded-lg border border-ink-200 bg-white p-5">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-ink-400">
            <span>Home</span>
            <ChevronRight className="h-3 w-3" />
            <span>Blog</span>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate text-ink-700">
              {article.title || "Your article title"}
            </span>
          </nav>

          {/* Header */}
          <div className="mt-4">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
              {article.category || "Category"}
            </span>
            <h3 className="mt-1 text-xl font-bold leading-tight tracking-tight text-ink-900">
              {article.title || "Your article title"}
            </h3>
            <div className="mt-2 flex items-center gap-2 text-xs text-ink-400">
              <CalendarDays className="h-3.5 w-3.5" />
              {date || "Publish date shown here"}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              {article.excerpt ||
                "The excerpt — a short summary shown under the title. Write one or two sentences that make visitors want to read on."}
            </p>
          </div>

          {/* Body */}
          {hasContent ? (
            <div
              className="rich mt-4"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
            />
          ) : (
            <div className="mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink-200 bg-ink-50/50 px-4 py-6 text-center">
              <p className="text-xs font-medium text-ink-400">
                Write your article in markdown — it renders here instantly
              </p>
              <p className="mt-0.5 text-[11px] text-ink-300">
                # headings, - lists, **bold**, tables and [links](url) all work
              </p>
            </div>
          )}

          {/* Footer strip, mirroring the live page's back-link */}
          <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-3">
            <span className="text-xs font-semibold text-brand-600">
              ← Back to all articles
            </span>
            <span className="text-[11px] text-ink-300">
              Comments + share buttons live here
            </span>
          </div>
        </div>
      </div>

      {/* Open live page */}
      {article.published === 1 && article.slug && (
        <Link
          href={`/blog/${article.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open live page in a new tab
        </Link>
      )}
    </div>
  );
}
