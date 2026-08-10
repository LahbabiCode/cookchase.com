import type { Metadata } from "next";
import Link from "next/link";
import {
  getFeaturedTools,
  getAllTools,
  getEnabledSections,
  getFeatureSections,
  getLatestArticles,
  getCommentsByToolMap,
  getViewsByToolMap,
  getSetting
} from "@/lib/queries";
import { ToolIcon } from "@/lib/icons";
import ToolCard from "@/components/ToolCard";
import AdSlot from "@/components/AdSlot";
import ShareButtons from "@/components/ShareButtons";
import Comments from "@/components/Comments";
import VoiceGuide from "@/components/VoiceGuide";
import { ArrowRight, Sparkles } from "lucide-react";
import ScaleDemo from "@/components/ScaleDemo";
import { getServerLang } from "@/lib/server-lang";
import { t, tCategory } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const title = getSetting("homepage_meta_title") || "CookChase — Free Cooking Tools & Kitchen Calculators";
  const description =
    getSetting("homepage_meta_description") ||
    "20+ free interactive cooking tools: scale recipes, convert units, time your roasts, plan meal prep and bake with confidence.";
  return { title, description };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CookChase",
  url: "https://cookchase.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://cookchase.com/tools?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export default function HomePage() {
  const lang = getServerLang();
  const sections = getEnabledSections();
  const get = (key: string) => sections.find((s) => s.key === key);

  const heroBadge = get("hero_badge");
  const heroTitle = get("hero_title")?.title || "Cook smarter with the right kitchen math";
  const heroSubtitle =
    get("hero_subtitle")?.title ||
    "Scale recipes, convert units, time your roasts and plan your week — 20+ fast, free cooking tools that do the math so you can focus on the cooking.";
  const heroCtaPrimary = get("hero_cta_primary")?.title || "Browse all tools";
  const heroCtaSecondary = get("hero_cta_secondary")?.title || "Explore the guides";

  const features = getFeatureSections();
  const featuredTools = getFeaturedTools();
  const allTools = getAllTools();
  const latestArticles = getLatestArticles(3);
  const commentCounts = getCommentsByToolMap();
  const viewsMap = getViewsByToolMap();

  const stats = [
    { value: `${allTools.length}+`, label: t(lang, "home.statFreeTools") },
    { value: "0", label: t(lang, "home.statSignups") },
    { value: "100%", label: t(lang, "home.statFormulas") },
    { value: "24/7", label: t(lang, "home.statAlways") }
  ];

  return (
    <>
      {/* Hero — the workbench: copy left, the scale reading your math right */}
      <section className="relative overflow-hidden bg-paper">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_85%_0%,rgba(45,99,73,0.12),transparent)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24">
          <div className="animate-fade-up">
            {heroBadge && heroBadge.enabled === 1 && (
              <span className="inline-flex items-center gap-2 border border-copper-300/60 bg-copper-50 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-copper-600" />
                <span className="eyebrow text-copper-700">
                  {heroBadge.badge || heroBadge.title}
                </span>
              </span>
            )}
            <h1 className="mt-6 max-w-xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-900 sm:text-6xl">
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-600">
              {heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800"
              >
                {heroCtaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center rounded-lg border border-ink-300 bg-white px-6 py-3 text-sm font-semibold text-ink-800 transition hover:border-copper-400 hover:text-copper-700"
              >
                {heroCtaSecondary}
              </Link>
            </div>
            {/* Stats as a scale readout row — real numbers, mono type */}
            <dl className="mt-12 grid max-w-lg grid-cols-2 gap-x-8 gap-y-6 border-t border-ink-200 pt-6 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="order-2 mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                    {s.label}
                  </dt>
                  <dd className="readout text-2xl font-bold text-ink-900">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex justify-center lg:justify-end">
            <ScaleDemo />
          </div>
        </div>
      </section>

      {/* Easy-mode read-aloud guide (senior-friendly) */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <VoiceGuide
          title={t(lang, "home.welcome")}
          intro={t(lang, "home.welcomeIntro")}
          steps={[
            t(lang, "home.voiceStep1"),
            t(lang, "home.voiceStep2"),
            t(lang, "home.voiceStep3"),
            t(lang, "home.voiceStep4")
          ]}
        />
      </div>

      {/* Features */}
      {features.length > 0 && (
        <section className="border-y border-ink-200 bg-linen">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="text-center">
              {get("features_badge") && get("features_badge")!.enabled === 1 && (
                <span className="eyebrow text-copper-600">
                  {get("features_badge")!.badge || get("features_badge")!.title}
                </span>
              )}
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                {get("features_title")?.title || "Every tool, one rule: no fluff"}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-ink-500">
                {get("features_subtitle")?.title}
              </p>
            </div>
            <div className="cv-auto mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.key}
                  className="rounded-xl border border-ink-200 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <ToolIcon name={f.badge || "Sparkles"} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-ink-900">{f.title}</h3>
                  {f.subtitle && (
                    <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-brand-600">
                      {f.subtitle}
                    </p>
                  )}
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ad */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <AdSlot location="home_middle" />
      </div>

      {/* Featured tools */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <span className="eyebrow text-copper-600">
              {get("tools_badge")?.badge || "The toolset"}
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              {get("tools_title")?.title || "Every kitchen calculator you'll ever need"}
            </h2>
            <p className="mt-3 max-w-2xl text-ink-500">
              {get("tools_subtitle")?.title}
            </p>
          </div>
          <Link
            href="/tools"
            className="hidden shrink-0 items-center gap-1.5 rounded-md border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-ink-300 hover:bg-ink-50 sm:inline-flex"
          >
            {t(lang, "home.viewAll", { n: allTools.length })}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="cv-auto mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTools.slice(0, 6).map((tool) => (
            <ToolCard
              key={tool.slug}
              tool={tool}
              commentCount={commentCounts[tool.slug] ?? 0}
              views={viewsMap[tool.slug] ?? 0}
              lang={lang}
            />
          ))}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/tools"
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700"
          >
            {t(lang, "home.viewAll", { n: allTools.length })}
          </Link>
        </div>
      </section>

      {/* About section */}
      <section className="border-y border-ink-200 bg-linen">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="eyebrow text-copper-600">
              {get("about_badge")?.badge || "About CookChase"}
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              {get("about_title")?.title || "Built by cooks who got tired of the math"}
            </h2>
            <p className="mt-4 leading-relaxed text-ink-600">{get("about_text")?.title}</p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              {t(lang, "home.readStory")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="cv-auto grid gap-4 sm:grid-cols-2">
            {[
              { icon: "Calculator", title: t(lang, "home.aboutCard1"), d: t(lang, "home.aboutCard1d") },
              { icon: "Shield", title: t(lang, "home.aboutCard2"), d: t(lang, "home.aboutCard2d") },
              { icon: "BookOpen", title: t(lang, "home.aboutCard3"), d: t(lang, "home.aboutCard3d") },
              { icon: "Heart", title: t(lang, "home.aboutCard4"), d: t(lang, "home.aboutCard4d") }
            ].map((c) => (
              <div key={c.title} className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
                <ToolIcon name={c.icon} className="h-5 w-5 text-brand-600" />
                <h3 className="mt-3 text-sm font-semibold text-ink-900">{c.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog preview */}
      {latestArticles.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                {t(lang, "home.fromBlog")}
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink-900">
                {t(lang, "home.kitchenKnowledge")}
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              {t(lang, "home.allArticles")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="cv-auto mt-8 grid gap-4 sm:grid-cols-3">
            {latestArticles.map((a) => (
              <Link
                key={a.slug}
                href={`/blog/${a.slug}`}
                className="group rounded-xl border border-ink-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                  {a.category}
                </span>
                <h3 className="mt-2 text-base font-semibold leading-snug text-ink-900 group-hover:text-brand-700">
                  {a.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-500">
                  {a.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-brand-950">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {get("cta_title")?.title || "Ready to cook with confidence?"}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-ink-300">{get("cta_text")?.title}</p>
          <Link
            href="/tools/recipe-scaler"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-copper-500 px-7 py-3 text-sm font-bold text-white transition hover:bg-copper-600"
          >
            {get("cta_button")?.title || "Open the Recipe Scaler"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Share */}
      <section className="border-b border-ink-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center sm:px-6">
          <p className="text-sm font-medium text-ink-500">
            {t(lang, "home.loveTools")}
          </p>
          <div className="mt-4 flex justify-center">
            <ShareButtons title="CookChase — Free cooking tools & kitchen calculators" />
          </div>
        </div>
      </section>

      {/* Comments */}
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <Comments pageType="page" pageSlug="home" />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
