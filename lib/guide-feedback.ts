// Pure helpers for the "Was this guide helpful?" feedback feature.
//
// Visitors vote yes/no under each tool's Quick guide; the vote is stored in
// the guide_feedback table and aggregated in the admin panel so the admin can
// see which tools need better explanations. This module is PURE (no codebase
// imports, standard library only) so node --test can load it — the DB access
// lives in lib/queries.ts, the client widget in components/GuideFeedback.tsx.

/** One tool's aggregated feedback row (from getGuideFeedbackStats). */
export interface GuideFeedbackStat {
  slug: string;
  name: string;
  helpful: number;
  notHelpful: number;
  total: number;
}

/** localStorage key guarding against a visitor voting twice on one tool. */
export function feedbackStorageKey(slug: string): string {
  return `cookchase:guide-feedback:${slug}`;
}

/** Percentage (0–100, rounded) of votes that said the guide was helpful. */
export function helpfulnessPct(yes: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((yes / total) * 100);
}

/**
 * Rank tools by how much their explanations need work: lowest helpfulness
 * percentage first, ties broken by more votes first (a bad guide with lots of
 * votes matters more), then alphabetically. Tools with no votes are excluded.
 */
export function sortByNeedsImprovement(stats: GuideFeedbackStat[]): GuideFeedbackStat[] {
  return stats
    .filter((s) => s.total > 0)
    .sort((a, b) => {
      const pa = helpfulnessPct(a.helpful, a.total) ?? 0;
      const pb = helpfulnessPct(b.helpful, b.total) ?? 0;
      if (pa !== pb) return pa - pb;
      if (b.total !== a.total) return b.total - a.total;
      return a.name.localeCompare(b.name);
    });
}

/**
 * A tool "needs a better explanation" when fewer than 60% of visitors found
 * the guide helpful AND at least 3 people voted (a single unhappy visitor is
 * not a trend worth chasing).
 */
export function needsBetterGuide(stat: GuideFeedbackStat): boolean {
  if (stat.total < 3) return false;
  const pct = helpfulnessPct(stat.helpful, stat.total);
  return pct !== null && pct < 60;
}
