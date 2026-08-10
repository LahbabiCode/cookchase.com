import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, getSetting } from "@/lib/queries";
import { renderMarkdown } from "@/lib/markdown";
import ContactForm from "./ContactForm";
import { getServerLang } from "@/lib/server-lang";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const lang = getServerLang();
  const page = getPage("contact");
  return {
    title: page?.meta_title || t(lang, "contact.metaTitle"),
    description: page?.meta_description || t(lang, "contact.metaDesc")
  };
}

export default function ContactPage() {
  const lang = getServerLang();
  const page = getPage("contact");
  if (!page) notFound();
  const email = getSetting("site_email") || "hello@cookchase.com";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
        {t(lang, "contact.eyebrow")}
      </span>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink-900">{page.title}</h1>
      <p className="mt-3 text-lg text-ink-500">{page.subtitle}</p>
      <div
        className="rich mt-8"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }}
      />
      <div className="mt-10 rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-semibold text-ink-900">{t(lang, "contact.sendTitle")}</h2>
        <p className="mt-1 text-sm text-ink-500">
          {t(lang, "contact.sendCopy", { email })}
        </p>
        <ContactForm email={email} />
      </div>
    </div>
  );
}
