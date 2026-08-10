"use client";

import Link from "next/link";
import { Check, ChevronRight, ExternalLink, Eye, HelpCircle, MessageCircle, Heart } from "lucide-react";
import { ToolIcon } from "@/lib/icons";
import { renderMarkdown } from "@/lib/markdown";
import { parseQuickGuide } from "@/lib/quick-guides";
import { PenLine, SlidersHorizontal, Sparkles, Lightbulb } from "lucide-react";
import { parseToolExampleValues } from "@/lib/tool-examples";

export interface PreviewTool {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  icon: string;
  description: string;
  how_to_use: string;
  formula: string;
  faq: string;
  tips: string;
  quick_guide: string;
  example_hint: string;
  example_values: string;
  meta_title: string;
  meta_description: string;
  status: string;
}

/**
 * Live preview of the visitor-facing tool page, driven by the admin editor's
 * current (unsaved) state. The interactive calculator itself can't run inside
 * the admin panel, so its slot is shown as a placeholder card — every text
 * section (title, tagline, description, how-to-use, formula, FAQ, tips, SEO)
 * updates in real time exactly as a visitor would see it.
 */
export default function ToolLivePreview({ tool }: { tool: PreviewTool }) {
  let faq: { q: string; a: string }[] = [];
  try {
    faq = JSON.parse(tool.faq || "[]");
    if (!Array.isArray(faq)) faq = [];
  } catch {
    faq = [];
  }
  let tips: string[] = [];
  try {
    tips = JSON.parse(tool.tips || "[]");
    if (!Array.isArray(tips)) tips = [];
  } catch {
    tips = [];
  }
  const guide = parseQuickGuide(tool.quick_guide);
  const exampleValues = parseToolExampleValues(tool.example_values);
  const exampleValuesCount = Object.keys(exampleValues).length;

  const descParas = tool.description.split(/\n\n+/).filter((p) => p.trim());
  const slug = tool.slug || "your-tool";
  const serpTitle =
    tool.meta_title ||
    (tool.name
      ? `${tool.name} — Free Online Tool | CookChase`
      : "Your tool name — Free Online Tool | CookChase");
  const serpDesc =
    tool.meta_description ||
    tool.tagline ||
    "Free, fast and accurate cooking tool. No sign-up required.";
  const titleFallback = !tool.meta_title;
  const descFallback = !tool.meta_description;

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
          <span className="truncate">cookchase.com › tools › {slug}</span>
        </div>
        <p className="mt-1 cursor-pointer truncate text-[17px] leading-snug text-[#1a0dab] hover:underline">
          {serpTitle}
        </p>
        <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-[#4d5156]">
          {serpDesc}
        </p>
        <p className="mt-1 text-xs text-[#70757a]">
          {tool.meta_title.length}/60 · {tool.meta_description.length}/160 characters
          {(titleFallback || descFallback) && (
            <span className="text-amber-600">
              {" "}— previewing generated defaults for empty fields
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
            <span>Tools</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-ink-700">{tool.name || "Your tool"}</span>
          </nav>

          {/* Header */}
          <div className="mt-4 flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
              <ToolIcon name={tool.icon} className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                {tool.category || "Category"}
              </p>
              <h3 className="mt-0.5 text-xl font-bold tracking-tight text-ink-900">
                {tool.name || "Your tool name"}
              </h3>
              <p className="mt-1 text-sm text-ink-500">
                {tool.tagline || "One-line description shown on cards."}
              </p>
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-3 flex items-center gap-3 border-b border-ink-100 pb-3 text-xs text-ink-400">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" /> Save
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" /> Share
            </span>
            <span>Free forever · No sign-up</span>
          </div>

          {/* Calculator slot */}
          <div className="mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink-200 bg-ink-50/50 px-4 py-8 text-center">
            <ToolIcon name={tool.icon} className="h-8 w-8 text-ink-300" />
            <p className="mt-2 text-xs font-medium text-ink-400">
              The interactive calculator lives here
            </p>
            <p className="mt-0.5 text-[11px] text-ink-300">
              Widgets are built in code — this preview shows the page layout only.
            </p>
            {(tool.example_hint || tool.example_values) && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-2 text-left">
                <Lightbulb className="h-4 w-4 shrink-0 text-brand-600" />
                <p className="text-xs text-ink-600">
                  <strong className="font-semibold text-brand-700">Try an example:</strong>{" "}
                  {tool.example_hint || "(hint left blank — widget's built-in hint shows)"}
                  {exampleValuesCount > 0 && (
                    <span className="mt-0.5 block text-[11px] text-ink-400">
                      Button fills {exampleValuesCount} value{exampleValuesCount === 1 ? "" : "s"} from the editor
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Quick guide — 3 steps, same position as the live page */}
          {guide.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {guide.map((step, i) => {
                const Icons = [PenLine, SlidersHorizontal, Sparkles];
                const Icon = Icons[i % Icons.length];
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2.5"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink-700">
                        <span className="text-brand-600">{i + 1}.</span>{" "}
                        {step.title || `Step ${i + 1}`}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">{step.text}</p>
                      {step.example && (
                        <p className="mt-1 font-mono text-[11px] leading-snug text-ink-400">
                          e.g. {step.example}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* About */}
          {descParas.length > 0 && (
            <section className="mt-5">
              <h4 className="text-sm font-bold text-ink-900">About this tool</h4>
              <div className="mt-1.5 space-y-2 text-sm leading-relaxed text-ink-600">
                {descParas.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          )}

          {/* How to use */}
          {tool.how_to_use.trim() && (
            <section className="mt-5">
              <h4 className="text-sm font-bold text-ink-900">How to use it</h4>
              <div
                className="rich mt-1.5 text-sm"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(tool.how_to_use) }}
              />
            </section>
          )}

          {/* Formula */}
          {tool.formula.trim() && (
            <section className="mt-5">
              <h4 className="flex items-center gap-1.5 text-sm font-bold text-ink-900">
                <HelpCircle className="h-4 w-4 text-brand-600" />
                How this tool works
              </h4>
              <div
                className="rich mt-1.5 rounded-lg border border-brand-100 bg-brand-50/50 p-4 text-sm"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(tool.formula) }}
              />
            </section>
          )}

          {/* FAQ */}
          {faq.length > 0 && (
            <section className="mt-5">
              <h4 className="text-sm font-bold text-ink-900">
                Frequently asked questions
              </h4>
              <div className="mt-2 space-y-2">
                {faq.map((f, i) => (
                  <details
                    key={i}
                    className="rounded-md border border-ink-200 bg-white"
                  >
                    <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-ink-900">
                      {f.q || "Question"}
                    </summary>
                    <p className="border-t border-ink-100 px-3 py-2 text-sm text-ink-600">
                      {f.a || "Answer"}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Tips */}
          {tips.length > 0 && (
            <section className="mt-5">
              <h4 className="text-sm font-bold text-ink-900">Pro tips</h4>
              <ul className="mt-2 space-y-1.5">
                {tips.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Empty state */}
          {descParas.length === 0 &&
            !tool.how_to_use.trim() &&
            !tool.formula.trim() &&
            faq.length === 0 &&
            tips.length === 0 &&
            guide.length === 0 && (
              <p className="mt-5 rounded-md bg-ink-50 px-3 py-2 text-center text-xs text-ink-400">
                Add description, how-to, explanation, FAQ or tips — they appear here
                instantly.
              </p>
            )}
        </div>
      </div>

      {/* Open live page */}
      {tool.status === "active" && tool.slug && (
        <Link
          href={`/tools/${tool.slug}`}
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
