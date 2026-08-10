"use client";

import { Sparkles } from "lucide-react";
import { useToolFacts } from "./faqStore";
import { buildDynamicFaq } from "@/lib/tool-faq";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { useLang } from "@/lib/useLang";
import { t } from "@/lib/i18n";

/**
 * Interactive FAQ section shown on every tool page. It merges two sources:
 *
 *  - Dynamic items (built by lib/tool-faq from the facts the tool widget
 *    publishes) whose answers speak in terms of the visitor's CURRENT inputs
 *    — "With 4 servings, each serving is 350 kcal". These appear/disappear as
 *    the visitor changes the values.
 *  - The static FAQ the admin wrote in the tool editor.
 *
 * Both render in one collapsible accordion so the page keeps a single
 * "Frequently asked questions" section that visibly reacts to the inputs.
 */
export default function DynamicFAQ({
  slug,
  staticFaq
}: {
  slug: string;
  staticFaq: { q: string; a: string }[];
}) {
  const { lang } = useLang();
  const facts = useToolFacts(slug);
  const dynamic = buildDynamicFaq(slug, facts);

  // Dedupe by normalized question text: the dynamic (input-aware) version wins
  // when it overlaps with a static admin question, so the same question never
  // shows twice in the accordion.
  const normalize = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9 ]+/g, " ");
  const seen = new Set<string>(dynamic.map((i) => normalize(i.q)));
  const staticOnly = staticFaq.filter((f) => {
    const key = normalize(f.q);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (dynamic.length === 0 && staticOnly.length === 0) return null;

  const hasLive = dynamic.length > 0;

  return (
    <section className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold text-ink-900">
          {t(lang, "hub.faqTitle")}
        </h2>
        {hasLive && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
            <Sparkles className="h-3 w-3" />
            {t(lang, "faqLive.followInputs")}
          </span>
        )}
      </div>

      {hasLive && (
        <p className="mt-1 text-sm text-ink-500">
          {t(lang, "faqLive.explainer")}
        </p>
      )}

      <div className="mt-4">
        <Accordion type="single" collapsible className="space-y-3">
          {dynamic.map((item, i) => (
            <AccordionItem
              key={`d-${i}`}
              value={`d-${i}`}
              className="overflow-hidden rounded-lg border border-brand-200 bg-white shadow-card data-[state=open]:border-brand-300"
            >
              <AccordionTrigger className="px-4 py-3.5 text-sm font-semibold text-ink-900 hover:no-underline [&>svg]:text-ink-400">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="border-t border-brand-100 bg-brand-50/30 px-4 text-sm leading-relaxed text-ink-600">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}

          {staticOnly.map((f, i) => (
            <AccordionItem
              key={`s-${i}`}
              value={`s-${i}`}
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
  );
}
