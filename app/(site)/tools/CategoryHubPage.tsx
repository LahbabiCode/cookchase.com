import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ChevronLeft, HelpCircle, LayoutGrid } from "lucide-react";
import {
  getToolsByCategory,
  getCommentsByToolMap,
  getViewsByToolMap,
  getSetting,
  getSiteUrl
} from "@/lib/queries";
import { getCategoryHub, getHubByCategory } from "@/lib/category-hubs";
import { ToolIcon } from "@/lib/icons";
import { breadcrumbLd, faqPageLd, itemListLd, collectionPageLd } from "@/lib/seo";
import ToolCard from "@/components/ToolCard";
import AdSlot from "@/components/AdSlot";
import ShareButtons from "@/components/ShareButtons";
import Comments from "@/components/Comments";
import { getServerLang } from "@/lib/server-lang";
import { t, tCategory } from "@/lib/i18n";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

export const dynamic = "force-dynamic";

/**
 * Shared server component for the category hub pages (/tools/baking, …).
 * Each static page under app/(site)/tools/<slug>/ renders this with its slug.
 * The tool grid is queried live so new tools added by the admin appear here
 * automatically.
 */
export default async function CategoryHubPage({ slug }: { slug: string }) {
  const hub = getCategoryHub(slug);
  if (!hub) notFound();

  const lang = getServerLang();
  const tools = getToolsByCategory(hub.category);
  const commentCounts = getCommentsByToolMap();
  const viewsMap = getViewsByToolMap();
  const siteUrl = getSiteUrl();
  const siteName = getSetting("site_name") || "CookChase";
  const pageUrl = `${siteUrl}/tools/${hub.slug}`;

  const jsonLdItemList = itemListLd(
    tools.map((t) => ({ name: t.name, url: `${siteUrl}/tools/${t.slug}` }))
  );
  const jsonLdBreadcrumb = breadcrumbLd([
    { name: t(lang, "toolDetail.home"), url: siteUrl },
    { name: t(lang, "toolDetail.tools"), url: `${siteUrl}/tools` },
    { name: hub.title, url: pageUrl }
  ]);
  const jsonLdCollection = collectionPageLd({
    name: hub.title,
    description: hub.metaDescription,
    url: pageUrl
  });
  const jsonLdFaq = faqPageLd(hub.faqs);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-ink-400"
      >
        <Link href="/" className="hover:text-brand-600">
          {t(lang, "toolDetail.home")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/tools" className="hover:text-brand-600">
          {t(lang, "toolDetail.tools")}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ink-700">{hub.title}</span>
      </nav>

      {/* Hero */}
      <div className="mt-8 max-w-3xl">
        <span className="eyebrow inline-flex items-center gap-1.5 text-copper-600">
          <LayoutGrid className="h-3.5 w-3.5" />
          {t(lang, "hub.freeTools", { n: tools.length })}
        </span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
          {hub.title}
        </h1>
        <p className="mt-4 text-lg text-ink-500">{hub.tagline}</p>
      </div>

      <div className="mt-6">
        <ShareButtons title={t(lang, "hub.shareTitle", { title: hub.title })} />
      </div>

      {/* Intro */}
      <section className="mt-10 max-w-3xl">
        {hub.intro.map((p, i) => (
          <p key={i} className="rich mb-4">
            {p}
          </p>
        ))}
      </section>

      <div className="mt-8">
        <AdSlot location="home_middle" />
      </div>

      {/* Tool grid */}
      <section aria-labelledby="hub-tools-heading" className="mt-10">
        <h2
          id="hub-tools-heading"
          className="text-2xl font-bold text-ink-900"
        >
          {t(lang, "hub.toolsHeading", { category: tCategory(lang, hub.category) })}
        </h2>
        {tools.length === 0 ? (
          <p className="mt-4 text-ink-500">
            {t(lang, "hub.empty")}
          </p>
        ) : (
          <div className="cv-auto mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((t) => (
              <ToolCard
                key={t.slug}
                tool={t}
                commentCount={commentCounts[t.slug] ?? 0}
                views={viewsMap[t.slug] ?? 0}
                lang={lang}
              />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="mt-16 max-w-3xl">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-ink-900">
          <HelpCircle className="h-6 w-6 text-brand-600" />
          {t(lang, "hub.howWorks")}
        </h2>
        <div className="rich mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-6">
          {hub.howItWorks}
        </div>
      </section>

      {/* FAQ */}
      {hub.faqs.length > 0 && (
        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold text-ink-900">
            {t(lang, "hub.faqTitle")}
          </h2>
          <div className="mt-4">
            <Accordion type="single" collapsible className="space-y-3">
              {hub.faqs.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-card data-[state=open]:border-brand-300"
                >
                  <AccordionTrigger className="px-4 py-3.5 text-sm font-semibold text-ink-900 hover:no-underline [&>svg]:text-ink-400">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="border-t border-ink-100 px-4 text-sm leading-relaxed text-ink-600">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* Related categories */}
      {hub.related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-ink-900">
            {t(lang, "hub.moreCategories")}
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {hub.related
              .map((s) => getHubByCategory(getCategoryHub(s)?.category ?? s))
              .filter(Boolean)
              .map((h) => h as NonNullable<typeof h>)
              .map((h) => (
                <Link
                  key={h.slug}
                  href={`/tools/${h.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-400 hover:text-brand-700"
                >
                  <ToolIcon name="Wrench" className="h-4 w-4 text-brand-600" />
                  {h.title}
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* Comments */}
      <div className="mx-auto max-w-3xl">
        <Comments pageType="tool_category" pageSlug={hub.slug} />
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 rounded-md border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 shadow-sm transition hover:border-ink-300 hover:bg-ink-50"
        >
          <ChevronLeft className="h-4 w-4" />
          {t(lang, "hub.browseAll")}
        </Link>
      </div>

      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCollection) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdItemList) }}
      />
      {jsonLdFaq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
        />
      )}
    </div>
  );
}

/** Build <Metadata> for a hub page from its slug. */
export function hubMetadata(slug: string): Metadata {
  const hub = getCategoryHub(slug);
  if (!hub) return {};
  const siteUrl = getSiteUrl();
  const siteName = getSetting("site_name") || "CookChase";
  const pageUrl = `${siteUrl}/tools/${hub.slug}`;
  return {
    title: hub.metaTitle,
    description: hub.metaDescription,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: hub.metaTitle,
      description: hub.metaDescription,
      type: "website",
      url: pageUrl,
      siteName,
      // /api/og/[slug] falls back to the brand card for non-tool slugs.
      images: [{ url: `${siteUrl}/api/og/${hub.slug}`, width: 1200, height: 630, alt: hub.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: hub.metaTitle,
      description: hub.metaDescription
    }
  };
}
