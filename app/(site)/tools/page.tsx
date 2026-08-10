import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllTools, getToolCategories, getCommentsByToolMap, getViewsByToolMap } from "@/lib/queries";
import AdSlot from "@/components/AdSlot";
import ShareButtons from "@/components/ShareButtons";
import Comments from "@/components/Comments";
import ToolsClient from "./ToolsClient";
import { getServerLang } from "@/lib/server-lang";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const title = "All Cooking Tools & Calculators";
  const description =
    "Browse 20+ free interactive cooking tools: recipe scaler, unit converter, meat cooking times, baking calculators, meal prep planner and more.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" }
  };
}

export default async function ToolsPage({
  searchParams
}: {
  searchParams: { category?: string; q?: string };
}) {
  const lang = getServerLang();
  const tools = getAllTools();
  const categories = getToolCategories();
  const commentCounts = getCommentsByToolMap();
  const viewsMap = getViewsByToolMap();
  const selected = searchParams.category || "";
  const q = searchParams.q || "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="text-center">          <span className="eyebrow text-copper-600">
            {t(lang, "tools.eyebrow", { n: tools.length })}
          </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
          {t(lang, "tools.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-500">
          {t(lang, "tools.subtitle")}
        </p>
      </div>

      <Suspense fallback={null}>
        <ToolsClient
          categories={categories}
          tools={tools}
          commentCounts={commentCounts}
          viewsCounts={viewsMap}
          initialCategory={selected}
          initialQuery={q}
        />
      </Suspense>

      <div className="mt-16">
        <AdSlot location="home_middle" />
      </div>

      <section className="mt-16 rounded-2xl border border-ink-200 bg-ink-50 p-8 sm:p-10">
        <h2 className="text-2xl font-bold text-ink-900">
          {t(lang, "tools.cantFind")}
        </h2>
        <p className="mt-2 max-w-2xl text-ink-500">
          {t(lang, "tools.suggestCopy")}
        </p>
        <a
          href="/contact"
          className="mt-5 inline-flex rounded-md bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          {t(lang, "tools.suggest")}
        </a>
      </section>

      <div className="mt-12">
        <ShareButtons title="All cooking tools & calculators — CookChase" />
      </div>

      <div className="mx-auto max-w-3xl pb-8">
        <Comments pageType="page" pageSlug="tools" />
      </div>
    </div>
  );
}
