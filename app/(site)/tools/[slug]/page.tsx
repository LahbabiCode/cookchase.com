import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Check, HelpCircle } from "lucide-react";
import {
  getToolBySlug,
  getRelatedTools,
  getCommentsByToolMap,
  getViewsByToolMap,
  getSetting,
  getSiteUrl
} from "@/lib/queries";
import { ToolIcon } from "@/lib/icons";
import { ToolWidget } from "@/components/tools";
import ExampleBridge from "@/components/tools/ExampleBridge";
import DynamicFAQ from "@/components/tools/DynamicFAQ";
import { QuickGuide } from "@/components/tools/ui";
import { parseQuickGuide } from "@/lib/quick-guides";
import { renderMarkdown, markdownToPlainText } from "@/lib/markdown";
import AdSlot from "@/components/AdSlot";
import ToolCard from "@/components/ToolCard";
import ShareButtons from "@/components/ShareButtons";
import Comments from "@/components/Comments";
import GuideFeedback from "@/components/GuideFeedback";
import FavButton from "@/components/FavButton";
import VoiceGuide from "@/components/VoiceGuide";
import { Badge } from "@/components/ui/badge";
import { incrementView } from "@/lib/queries";
import { breadcrumbLd, howToLd, recipeLd, webAppLd } from "@/lib/seo";
import { getServerLang } from "@/lib/server-lang";
import { t, tCategory } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const tool = getToolBySlug(params.slug);
  if (!tool) return {};
  const siteName = getSetting("site_name") || "CookChase";
  const siteUrl = getSiteUrl();
  const title = tool.meta_title || `${tool.name} — Free Online Tool | ${siteName}`;
  const description =
    tool.meta_description ||
    `${tool.tagline} Free, fast and accurate ${tool.name} tool by ${siteName}. No sign-up required.`;
  const pageUrl = `${siteUrl}/tools/${tool.slug}`;
  const ogImage = `${siteUrl}/api/og/${tool.slug}`;
  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      type: "website",
      url: pageUrl,
      siteName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage]
    }
  };
}

export default async function ToolPage({
  params
}: {
  params: { slug: string };
}) {
  const lang = getServerLang();
  const tool = getToolBySlug(params.slug);
  if (!tool) notFound();

  // Lightweight analytics (fire and forget on server render). This must not
  // count speculative renders as real views: Speculation Rules prerenders
  // carry Sec-Purpose/Purpose headers, and Next.js <Link> hover-prefetches
  // send Next-Router-Prefetch — both execute this server component before the
  // visitor actually lands, so they must not increment the counter.
  try {
    const h = headers();
    const purpose = `${h.get("sec-purpose") || ""} ${h.get("purpose") || ""}`.toLowerCase();
    const speculative =
      /prefetch|prerender/.test(purpose) || h.get("next-router-prefetch") === "1";
    if (!speculative) incrementView(tool.slug);
  } catch {
    /* ignore */
  }

  const related = getRelatedTools(tool);
  const commentCounts = getCommentsByToolMap();
  const viewsMap = getViewsByToolMap();
  const siteUrl = getSiteUrl();

  let faq: { q: string; a: string }[] = [];
  try {
    faq = JSON.parse(tool.faq || "[]");
  } catch {
    faq = [];
  }
  let tips: string[] = [];
  try {
    tips = JSON.parse(tool.tips || "[]");
  } catch {
    tips = [];
  }

  // Admin-editable 3-step Quick guide (tools.quick_guide). Backfilled for the
  // built-in tools from lib/quick-guides; new admin-created tools get it from
  // the editor's required field. Rendered for every tool automatically.
  const quickGuide = parseQuickGuide(tool.quick_guide);

  // Plain-language steps for the read-aloud guide, parsed from the
  // "How to use it" markdown (numbered or bulleted list items).
  const guideSteps = (() => {
    const lines = (tool.how_to_use || "")
      .split("\n")
      .map((l) => l.replace(/\*\*/g, "").trim())
      .filter((l) => /^\d+[.)]\s+/.test(l) || /^[-*]\s+/.test(l))
      .map((l) => l.replace(/^\d+[.)]\s+/, "").replace(/^[-*]\s+/, ""))
      .filter((l) => l.length > 4)
      .slice(0, 6);
    if (lines.length >= 2) return lines;
    return [
      t(lang, "toolDetail.guideFallback1", { tool: tool.name }),
      t(lang, "toolDetail.guideFallback2"),
      t(lang, "toolDetail.guideFallback3"),
      t(lang, "toolDetail.guideFallback4")
    ];
  })();

  const siteName = getSetting("site_name") || "CookChase";
  const pageUrl = `${siteUrl}/tools/${tool.slug}`;

  const jsonLd = webAppLd({
    name: tool.name,
    slug: tool.slug,
    tagline: tool.tagline,
    siteUrl,
    siteName
  });

  const jsonLdHowTo = howToLd({
    name: `How to use the ${tool.name}`,
    description: tool.tagline,
    steps: guideSteps
  });

  const jsonLdBreadcrumb = breadcrumbLd([
    { name: "Home", url: siteUrl },
    { name: "Tools", url: `${siteUrl}/tools` },
    { name: tool.name, url: pageUrl }
  ]);

  const jsonLdRecipe = recipeLd({
    slug: tool.slug,
    description: tool.tagline,
    steps: guideSteps,
    siteUrl,
    siteName
  });

  const jsonLdFaq = faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a }
        }))
      }
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Breadcrumbs */}
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
        <span className="text-ink-700">{tool.name}</span>
      </nav>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <ToolIcon name={tool.icon} className="h-7 w-7" />
          </span>
          <div>
            <span className="eyebrow text-copper-600">{tCategory(lang, tool.category)}</span>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              {tool.name}
            </h1>
            <p className="mt-2 max-w-2xl text-ink-500">{tool.tagline}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FavButton slug={tool.slug} size="md" />
          <Badge variant="secondary" className="text-xs font-medium">{t(lang, "tool.freeForever")}</Badge>
        </div>
        <ShareButtons title={t(lang, "toolDetail.shareTitle", { tool: tool.name })} />
      </div>

      <VoiceGuide
        title={`${t(lang, "toolDetail.howTo")} ${tool.name}`}
        intro={`${tool.name} ${t(lang, "toolDetail.voiceIntro", { tagline: tool.tagline.toLowerCase().replace(/\.$/, "") })}`}
        steps={guideSteps}
        sections={[
          { label: t(lang, "toolDetail.about"), content: markdownToPlainText(tool.description) },
          ...(tool.formula.trim()
            ? [{ label: t(lang, "toolDetail.howWorks"), content: markdownToPlainText(tool.formula) }]
            : []),
          ...(tips.length
            ? [{ label: t(lang, "toolDetail.proTips"), content: tips.join(". ") }]
            : [])
        ]}
        faq={faq}
      />

      <div className="mt-8">
        <AdSlot location="tool_top" className="mb-6" />
      </div>

      {/* The interactive widget */}
      <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
        {quickGuide.length > 0 && (
          <div className="mb-6">
            <QuickGuide steps={quickGuide} />
            {/* One yes/no vote per visitor per tool — feeds the admin's
                guide-quality report. Only shown when a guide exists. */}
            <GuideFeedback slug={tool.slug} />
          </div>
        )}
        <ExampleBridge slug={tool.slug} hint={tool.example_hint ?? ""} values={tool.example_values ?? ""} />
        <ToolWidget slug={tool.slug} />
      </div>

      <div className="mt-6">
        <AdSlot location="tool_bottom" />
      </div>

      {/* Interactive FAQ — dynamic items react to the visitor's current
          inputs (published by the widget above); static items come from the
          tool editor. Rendered here, close to the widget, so answers visibly
          update as the visitor changes values. */}
      <div className="mt-12">
        <DynamicFAQ slug={tool.slug} staticFaq={faq} />
      </div>

      {/* Description */}
      <section className="mt-12 max-w-3xl">
        <h2 className="text-2xl font-bold text-ink-900">{t(lang, "toolDetail.about")}</h2>
        <div className="rich mt-3">
          {tool.description.split("\n\n").map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      {/* How to use */}
      <section className="mt-12 max-w-3xl">
        <h2 className="text-2xl font-bold text-ink-900">{t(lang, "toolDetail.howTo")}</h2>
        <div className="rich mt-3">
          <div
            dangerouslySetInnerHTML={{ __html: renderMarkdown(tool.how_to_use) }}
          />
        </div>
      </section>

      {/* How it works — plain-language explanation for home cooks */}
      {tool.formula.trim() && (
        <section className="mt-12 max-w-3xl">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-ink-900">
            <HelpCircle className="h-6 w-6 text-brand-600" />
            {t(lang, "toolDetail.howWorks")}
          </h2>
          <div className="rich mt-3 rounded-xl border border-brand-100 bg-brand-50/50 p-6">
            <div
              dangerouslySetInnerHTML={{ __html: renderMarkdown(tool.formula) }}
            />
          </div>
        </section>
      )}

      {/* Tips */}
      {tips.length > 0 && (
        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl font-bold text-ink-900">{t(lang, "toolDetail.proTips")}</h2>
          <ul className="mt-4 space-y-3">
            {tips.map((t, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-brand-100 bg-brand-50/60 p-4"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span className="text-sm leading-relaxed text-ink-700">{t}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Related tools */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-ink-900">{t(lang, "toolDetail.mightLike")}</h2>
          <div className="cv-auto mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((t) => (
              <ToolCard
                key={t.slug}
                tool={t}
                commentCount={commentCounts[t.slug] ?? 0}
                views={viewsMap[t.slug] ?? 0}
                lang={lang}
              />
            ))}
          </div>
        </section>
      )}

      {/* Comments */}
      <div className="mx-auto max-w-3xl">
        <Comments pageType="tool" pageSlug={tool.slug} />
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 rounded-md border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 shadow-sm transition hover:border-ink-300 hover:bg-ink-50"
        >
          <ChevronLeft className="h-4 w-4" />
          {t(lang, "toolDetail.browseAll")}
        </Link>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdHowTo) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      {jsonLdRecipe && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdRecipe) }}
        />
      )}
      {jsonLdFaq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
        />
      )}
    </div>
  );
}
