import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedArticles, getSiteUrl } from "@/lib/queries";
import AdSlot from "@/components/AdSlot";
import ShareButtons from "@/components/ShareButtons";
import Comments from "@/components/Comments";
import { ArrowRight } from "lucide-react";
import { getServerLang } from "@/lib/server-lang";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const title = "Cooking Blog & Guides";
  const description =
    "Practical cooking guides: how to scale recipes, oven temperature conversions, meal prep routines and more kitchen know-how.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" }
  };
}

export default function BlogPage() {
  const lang = getServerLang();
  const siteUrl = getSiteUrl();
  const articles = getPublishedArticles();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {t(lang, "blog.badge")}
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
          {t(lang, "blog.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-500">
          {t(lang, "blog.subtitle")}
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <article
            key={a.slug}
            className="group flex flex-col rounded-xl border border-ink-200 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              {a.category}
            </span>
            <Link href={`/blog/${a.slug}`} className="mt-2 block">
              <h2 className="text-lg font-semibold leading-snug text-ink-900 group-hover:text-brand-700">
                {a.title}
              </h2>
            </Link>
            {/* Share row — under the title, outside the article link so each
                card shares its own URL without nesting interactive elements. */}
            <div className="mt-3 border-t border-ink-100 pt-3">
              <ShareButtons title={a.title} url={`${siteUrl}/blog/${a.slug}`} compact />
            </div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-500">{a.excerpt}</p>
            <Link
              href={`/blog/${a.slug}`}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600"
            >
              {t(lang, "blog.readArticle")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-14">
        <AdSlot location="home_middle" />
      </div>

      <div className="mt-12">
        <ShareButtons title={`${t(lang, "blog.title")} — CookChase`} />
      </div>

      <div className="mx-auto max-w-3xl pb-8">
        <Comments pageType="page" pageSlug="blog" />
      </div>
    </div>
  );
}
