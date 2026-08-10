import Link from "next/link";
import { ArrowRight, Eye, MessageCircle, Star } from "lucide-react";
import { ToolIcon } from "@/lib/icons";
import FavButton from "@/components/FavButton";
import type { Tool } from "@/lib/queries";
import { t, tCategory, type Lang } from "@/lib/i18n";

/**
 * Compact number for the stat badges: 1,234 → "1.2k", 12,000 → "12k".
 * The full count still appears in the tooltip / aria-label.
 */
function compact(n: number): string {
  if (n >= 1000) {
    return n >= 10000
      ? `${Math.round(n / 1000)}k`
      : `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(n);
}

export default function ToolCard({
  tool,
  commentCount,
  views,
  lang
}: {
  tool: Tool;
  commentCount: number;
  /** All-time view count (from the analytics table), shown as a badge. */
  views: number;
  // Passed in by the caller: server pages resolve it via getServerLang(),
  // client components via useLang(). ToolCard itself must stay importable from
  // both (calling next/headers inside would break the client bundle).
  lang: Lang;
}) {
  const totalViewsLabel = views === 1
    ? t(lang, "tool.totalViews", { n: views })
    : t(lang, "tool.totalViewsPlural", { n: views });
  const commentLabel = commentCount === 1
    ? t(lang, "tool.approvedComment", { n: commentCount })
    : t(lang, "tool.approvedCommentPlural", { n: commentCount });
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group relative flex flex-col rounded-2xl border border-ink-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-paper"
    >
      {/* copper tick on hover — the pan heats up */}
      <span
        aria-hidden="true"
        className="absolute inset-x-5 top-0 h-0.5 origin-left scale-x-0 rounded-full bg-copper-400 transition-transform duration-300 group-hover:scale-x-100"
      />
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700 transition group-hover:border-brand-700 group-hover:bg-brand-700 group-hover:text-copper-200">
          <ToolIcon name={tool.icon} className="h-5 w-5" />
        </span>
        <div className="flex items-center gap-2">
          {tool.featured === 1 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-copper-50 px-2 py-0.5 text-[11px] font-bold text-copper-700">
              <Star className="h-3 w-3 fill-copper-500 text-copper-500" />
              {t(lang, "tool.featured")}
            </span>
          )}
          <FavButton slug={tool.slug} />
        </div>
      </div>
      <p className="eyebrow mt-4 text-copper-600">{tCategory(lang, tool.category)}</p>
      <h3 className="mt-1.5 font-display text-lg font-bold text-ink-900 group-hover:text-brand-800">
        {tool.name}
      </h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-500">
        {tool.tagline}
      </p>
      <div className="mt-4 border-t border-ink-100 pt-3">
        {/* Stats — views + comments as tinted pills; colors pop when a tool
            has real traction so popular tools read instantly. */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums transition ${
              views > 0
                ? "bg-brand-50 text-brand-700 ring-1 ring-brand-100"
                : "bg-ink-50 text-ink-400"
            }`}
            title={totalViewsLabel}
            aria-label={totalViewsLabel}
          >
            <Eye className="h-3 w-3" aria-hidden="true" />
            {compact(views)}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums transition ${
              commentCount > 0
                ? "bg-copper-50 text-copper-700 ring-1 ring-copper-200/60"
                : "bg-ink-50 text-ink-400"
            }`}
            title={commentLabel}
            aria-label={commentLabel}
          >
            <MessageCircle className="h-3 w-3" aria-hidden="true" />
            {commentCount === 1
              ? t(lang, "tool.commentCount", { n: commentCount })
              : t(lang, "tool.commentCountPlural", { n: commentCount })}
          </span>
        </div>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-700 opacity-0 transition group-hover:opacity-100">
          {t(lang, "tool.open")} <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
