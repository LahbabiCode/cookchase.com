import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/queries";
import { renderMarkdown } from "@/lib/markdown";
import AdSlot from "@/components/AdSlot";
import { getServerLang } from "@/lib/server-lang";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const lang = getServerLang();
  const page = getPage("about");
  return {
    title: page?.meta_title || t(lang, "about.metaTitle"),
    description: page?.meta_description || t(lang, "about.metaDesc")
  };
}

export default function AboutPage() {
  const lang = getServerLang();
  const page = getPage("about");
  if (!page) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
        {t(lang, "about.eyebrow")}
      </span>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink-900">{page.title}</h1>
      <p className="mt-3 text-lg text-ink-500">{page.subtitle}</p>
      <div
        className="rich mt-8"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }}
      />
      <div className="mt-10">
        <AdSlot location="tool_bottom" />
      </div>
    </div>
  );
}
