import { test } from "node:test";
import assert from "node:assert/strict";
import {
  feedbackStorageKey,
  helpfulnessPct,
  needsBetterGuide,
  sortByNeedsImprovement,
  type GuideFeedbackStat
} from "../lib/guide-feedback.ts";

function stat(p: Partial<GuideFeedbackStat> & { slug: string }): GuideFeedbackStat {
  return {
    name: p.slug.replace(/-/g, " "),
    helpful: 0,
    notHelpful: 0,
    total: 0,
    ...p
  };
}

// --- feedbackStorageKey ----------------------------------------------------

test("feedbackStorageKey scopes the vote per tool slug", () => {
  assert.equal(
    feedbackStorageKey("water-intake"),
    "cookchase:guide-feedback:water-intake"
  );
  assert.notEqual(
    feedbackStorageKey("water-intake"),
    feedbackStorageKey("recipe-scaler")
  );
});

// --- helpfulnessPct --------------------------------------------------------

test("helpfulnessPct returns the rounded share of yes votes", () => {
  assert.equal(helpfulnessPct(3, 4), 75);
  assert.equal(helpfulnessPct(1, 3), 33);
  assert.equal(helpfulnessPct(0, 5), 0);
  assert.equal(helpfulnessPct(5, 5), 100);
});

test("helpfulnessPct returns null when nobody voted", () => {
  assert.equal(helpfulnessPct(0, 0), null);
  assert.equal(helpfulnessPct(3, 0), null);
});

// --- sortByNeedsImprovement -------------------------------------------------

test("sortByNeedsImprovement ranks lowest helpfulness first", () => {
  const stats = [
    stat({ slug: "good", helpful: 8, notHelpful: 2, total: 10 }),   // 80%
    stat({ slug: "bad", helpful: 1, notHelpful: 4, total: 5 }),      // 20%
    stat({ slug: "okay", helpful: 5, notHelpful: 5, total: 10 })     // 50%
  ];
  const ranked = sortByNeedsImprovement(stats).map((s) => s.slug);
  assert.deepEqual(ranked, ["bad", "okay", "good"]);
});

test("sortByNeedsImprovement breaks ties by more votes first", () => {
  const stats = [
    stat({ slug: "a", helpful: 1, notHelpful: 1, total: 2 }),  // 50%, 2 votes
    stat({ slug: "b", helpful: 3, notHelpful: 3, total: 6 })   // 50%, 6 votes
  ];
  const ranked = sortByNeedsImprovement(stats).map((s) => s.slug);
  assert.deepEqual(ranked, ["b", "a"]);
});

test("sortByNeedsImprovement drops tools with no votes", () => {
  const stats = [
    stat({ slug: "voted", helpful: 2, notHelpful: 0, total: 2 }),
    stat({ slug: "unvoted", helpful: 0, notHelpful: 0, total: 0 })
  ];
  assert.deepEqual(sortByNeedsImprovement(stats).map((s) => s.slug), ["voted"]);
});

test("sortByNeedsImprovement returns a new array and never mutates input", () => {
  const input = [stat({ slug: "b", helpful: 1, notHelpful: 1, total: 2 })];
  const ranked = sortByNeedsImprovement(input);
  assert.notEqual(ranked, input);
  assert.equal(input[0].slug, "b");
});

// --- needsBetterGuide -------------------------------------------------------

test("needsBetterGuide flags guides under 60% with at least 3 votes", () => {
  // 2/4 = 50% → needs work
  assert.equal(
    needsBetterGuide(stat({ slug: "x", helpful: 2, notHelpful: 2, total: 4 })),
    true
  );
  // 3/5 = 60% → exactly at the line, ok
  assert.equal(
    needsBetterGuide(stat({ slug: "x", helpful: 3, notHelpful: 2, total: 5 })),
    false
  );
  // 6/10 = 60% → ok
  assert.equal(
    needsBetterGuide(stat({ slug: "x", helpful: 6, notHelpful: 4, total: 10 })),
    false
  );
});

test("needsBetterGuide ignores tiny samples (fewer than 3 votes)", () => {
  // 0/2 = 0% but only two people — not a trend worth chasing.
  assert.equal(
    needsBetterGuide(stat({ slug: "x", helpful: 0, notHelpful: 2, total: 2 })),
    false
  );
  // 1/3 = 33% → real signal, flagged.
  assert.equal(
    needsBetterGuide(stat({ slug: "x", helpful: 1, notHelpful: 2, total: 3 })),
    true
  );
});
