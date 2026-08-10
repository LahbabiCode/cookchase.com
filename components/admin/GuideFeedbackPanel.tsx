import Link from "next/link";
import {
  getGuideFeedbackStats,
  getGuideFeedbackTotal
} from "@/lib/queries";
import {
  helpfulnessPct,
  needsBetterGuide,
  sortByNeedsImprovement,
  type GuideFeedbackStat
} from "@/lib/guide-feedback";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquareText,
  ArrowRight,
  TriangleAlert
} from "lucide-react";

/**
 * "Guide feedback" card for the admin dashboard. Ranks every tool that has
 * received a yes/no vote by helpfulness percentage — worst first — and flags
 * the guides where fewer than 60% of visitors said they helped. Each row
 * links straight to that tool's editor so the explanation can be rewritten
 * in two clicks.
 */
export default function GuideFeedbackPanel() {
  const stats = getGuideFeedbackStats();
  const total = getGuideFeedbackTotal();
  const ranked = sortByNeedsImprovement(stats);
  const needsWork = ranked.filter(needsBetterGuide);

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <MessageSquareText className="h-4 w-4 text-violet-600" />
          Guide feedback
        </h2>
        <span className="text-xs text-ink-400">
          {total.toLocaleString()} vote{total === 1 ? "" : "s"} ·{" "}
          {ranked.length} tool{ranked.length === 1 ? "" : "s"}
        </span>
      </div>

      {total === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-ink-300 py-10 text-center text-sm text-ink-400">
          No votes yet — the &ldquo;Was this guide helpful?&rdquo; buttons sit under
          every tool&apos;s Quick guide.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {needsWork.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>
                <strong>
                  {needsWork.length} guide{needsWork.length === 1 ? "" : "s"} need
                  a better explanation
                </strong>{" "}
                — fewer than 60% of visitors found them helpful. Rows below are
                sorted worst-first.
              </span>
            </div>
          )}

          {ranked.map((s: GuideFeedbackStat) => {
            const pct = helpfulnessPct(s.helpful, s.total) ?? 0;
            const flag = needsBetterGuide(s);
            return (
              <Link
                key={s.slug}
                href={`/admin/tools/${s.slug}/edit#quick-guide`}
                className="group block rounded-lg border border-ink-100 px-3 py-2.5 transition hover:border-brand-300 hover:bg-brand-50/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink-800">
                    <span className="truncate">{s.name}</span>
                    {flag && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        Needs work
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3 text-emerald-600" />
                      {s.helpful}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ThumbsDown className="h-3 w-3 text-red-500" />
                      {s.notHelpful}
                    </span>
                    <span className="w-12 text-right font-bold text-ink-900">
                      {pct}%
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-ink-300 transition group-hover:text-brand-500" />
                  </span>
                </div>
                {/* Helpfulness bar: green = helpful share */}
                <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={`h-full rounded-full ${flag ? "bg-amber-400" : "bg-emerald-500"}`}
                    style={{ width: `${pct}%` }}
                    title={`${pct}% found it helpful`}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {ranked.length > 0 && (
        <p className="mt-4 text-[11px] text-ink-400">
          Sorted by helpfulness % — lowest first. Click a row to rewrite that
          tool&apos;s Quick guide.
        </p>
      )}
    </div>
  );
}
