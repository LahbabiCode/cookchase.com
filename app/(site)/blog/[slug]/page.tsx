import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CalendarDays } from "lucide-react";
import {
  getArticleBySlug,
  getSetting,
  getSiteUrl,
  incrementArticleView
} from "@/lib/queries";
import { breadcrumbLd } from "@/lib/seo";
import { renderMarkdown } from "@/lib/markdown";
import AdSlot from "@/components/AdSlot";
import ShareButtons from "@/components/ShareButtons";
import Comments from "@/components/Comments";
import { getServerLang } from "@/lib/server-lang";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = getArticleBySlug(params.slug);
  if (!article) return {};
  const siteName = getSetting("site_name") || "CookChase";
  const siteUrl = getSiteUrl();
  const title = article.meta_title || `${article.title} | ${siteName}`;
  const description = article.meta_description || article.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/blog/${article.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${siteUrl}/blog/${article.slug}`,
      siteName,
      publishedTime: article.created_at
    }
  };
}

export default async function ArticlePage({
  params
}: {
  params: { slug: string };
}) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  // Lightweight analytics (same speculative-render guard as tool pages):
  // prerenders/prefetches carry Sec-Purpose/Purpose headers and must not
  // count as real views, so article spike alerts stay accurate.
  try {
    const h = headers();
    const purpose = `${h.get("sec-purpose") || ""} ${h.get("purpose") || ""}`.toLowerCase();
    const speculative =
      /prefetch|prerender/.test(purpose) || h.get("next-router-prefetch") === "1";
    if (!speculative) incrementArticleView(article.slug);
  } catch {
    /* ignore */
  }

  const lang = getServerLang();
  const siteUrl = getSiteUrl();
  const siteName = getSetting("site_name") || "CookChase";

  const pageUrl = `${siteUrl}/blog/${article.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.created_at,
    author: { "@type": "Organization", name: siteName },
    publisher: { "@type": "Organization", name: siteName },
    mainEntityOfPage: pageUrl
  };

  const jsonLdBreadcrumb = breadcrumbLd([
    { name: t(lang, "toolDetail.home"), url: siteUrl },
    { name: t(lang, "toolDetail.tools"), url: `${siteUrl}/blog` },
    { name: article.title, url: pageUrl }
  ]);

  const date = new Date(article.created_at + "Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <nav className="flex items-center gap-1.5 text-sm text-ink-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-600">{t(lang, "toolDetail.home")}</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-brand-600">{t(lang, "toolDetail.tools")}</Link>
      </nav>

      <div className="mt-6">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          {article.category}
        </span>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-ink-900 sm:text-4xl">
          {article.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-ink-400">
            <CalendarDays className="h-4 w-4" />
            {date}
          </div>
          <ShareButtons title={article.title} />
        </div>
        <p className="mt-4 text-lg leading-relaxed text-ink-500">{article.excerpt}</p>
      </div>

      <div className="mt-6">
        <AdSlot location="tool_top" />
      </div>

      <div
        className="rich mt-6"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
      />

      <div className="mt-8">
        <AdSlot location="tool_bottom" />
      </div>

      <Comments pageType="article" pageSlug={article.slug} />

      <div className="mt-12 border-t border-ink-200 pt-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          <ChevronLeft className="h-4 w-4" />
          {t(lang, "blog.backToArticles")}
        </Link>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
    </div>
  );
}
