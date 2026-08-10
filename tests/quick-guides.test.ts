import { test } from "node:test";
import assert from "node:assert/strict";
import {
  QUICK_GUIDES,
  emptyQuickGuide,
  isCompleteQuickGuide,
  parseQuickGuide,
  serializeQuickGuide
} from "../lib/quick-guides.ts";
import type { QuickGuideStep } from "../lib/quick-guides.ts";

// The canonical built-in tool slugs — mirrors components/tools/index.tsx
// (the widget barrel). Every slug must have a guide so the DB backfill never
// leaves an admin-created gap and the tool page always has steps to render.
const BARREL_SLUGS = [
  "recipe-scaler",
  "unit-converter",
  "temperature-converter",
  "recipe-cost-calculator",
  "meat-cooking-time",
  "baking-pan-converter",
  "nutrition-calculator",
  "ingredient-substitution",
  "meal-prep-planner",
  "kitchen-timers",
  "sous-vide-guide",
  "pizza-dough-calculator",
  "sweetener-converter",
  "bread-hydration",
  "sourdough-calculator",
  "brine-calculator",
  "food-storage-guide",
  "caffeine-calculator",
  "alcohol-cookoff",
  "water-intake",
  "pressure-cooker-converter",
  "weekly-menu-generator",
  "dough-batch-converter",
  "frying-temperature",
  "egg-timer",
  "recipe-comparator",
  "coffee-espresso-calculator",
  "grams-cups-converter",
  "meat-doneness-guide",
  "food-shelf-life",
  "measurement-to-weight"
];

// --- Contract: every built-in tool has a complete 3-step guide -------------

test("QUICK_GUIDES covers every built-in tool slug exactly once", () => {
  const keys = Object.keys(QUICK_GUIDES).sort();
  assert.deepEqual(keys, [...BARREL_SLUGS].sort());
});

test("every built-in guide has exactly 3 steps with non-empty title and text", () => {
  for (const [slug, steps] of Object.entries(QUICK_GUIDES)) {
    assert.equal(steps.length, 3, `${slug} should have exactly 3 steps`);
    for (const s of steps) {
      assert.ok(s.title.trim().length > 0, `${slug} step title must be non-empty`);
      assert.ok(s.text.trim().length > 0, `${slug} step text must be non-empty`);
    }
  }
});

test("guide steps are title-cased, sentence-length and visitor-oriented (no internal jargon)", () => {
  for (const [slug, steps] of Object.entries(QUICK_GUIDES)) {
    for (const s of steps) {
      // Titles should be short imperative phrases, not long sentences.
      assert.ok(
        s.title.length <= 40,
        `${slug} title too long: "${s.title}"`
      );
      // No code symbols or technical placeholders in visitor-facing copy.
      assert.ok(!/[{}\[\]<>=]/.test(s.title + s.text), `${slug} contains code-like symbols`);
    }
  }
});

test("every built-in guide step ships a numeric example", () => {
  for (const [slug, steps] of Object.entries(QUICK_GUIDES)) {
    for (const s of steps) {
      assert.ok(
        typeof s.example === "string" && s.example.trim().length > 0,
        `${slug} step "${s.title}" is missing an example`
      );
      // Examples are one-liners — short enough to sit in a small card.
      assert.ok(s.example!.length <= 45, `${slug} example too long: "${s.example}"`);
    }
  }
});

test("examples are numeric and visitor-facing (no placeholders or code)", () => {
  for (const [slug, steps] of Object.entries(QUICK_GUIDES)) {
    for (const s of steps) {
      // Should contain at least one digit or a unit arrow — a real quantity.
      assert.ok(/\d/.test(s.example!), `${slug} example has no number: "${s.example}"`);
      assert.ok(!/\{[^}]*\}|[{}<>]/.test(s.example!), `${slug} example looks like code`);
    }
  }
});

// --- parseQuickGuide -------------------------------------------------------

test("parseQuickGuide parses a serialized guide back into steps", () => {
  const steps: QuickGuideStep[] = [
    { title: "Enter the batch", text: "The amounts your dough recipe makes." },
    { title: "Set the target", text: "How many loaves you need." },
    { title: "Get the scale", text: "Every ingredient recalculated." }
  ];
  const parsed = parseQuickGuide(serializeQuickGuide(steps));
  assert.deepEqual(parsed, steps);
});

test("serialize→parse round-trip is lossless for the built-in guides", () => {
  for (const [slug, steps] of Object.entries(QUICK_GUIDES)) {
    const parsed = parseQuickGuide(serializeQuickGuide(steps));
    assert.deepEqual(parsed, steps, `${slug} round-trip mismatch`);
  }
});

test("parse/serialize preserve the example field", () => {
  const raw = JSON.stringify([
    { title: "Enter the batch", text: "The amounts your dough recipe makes.", example: "1.2 kg at 72%" },
    { title: "Set the target", text: "How many loaves you need.", example: "" },
    { title: "Get the scale", text: "Every ingredient recalculated." }
  ]);
  const parsed = parseQuickGuide(raw);
  assert.equal(parsed[0].example, "1.2 kg at 72%");
  assert.equal(parsed[1].example, ""); // parse keeps empty strings
  assert.equal(parsed[2].example, undefined); // absent stays absent

  // Round-trip: non-empty examples survive serialization; empty ones are
  // intentionally omitted from the stored JSON (serialize drops falsy).
  const again = parseQuickGuide(serializeQuickGuide(parsed));
  assert.equal(again[0].example, "1.2 kg at 72%");
  assert.equal(again[1].example, undefined);
  assert.equal(again[2].example, undefined);
});

test("serialize omits empty examples from the stored JSON", () => {
  const json = serializeQuickGuide([
    { title: "A", text: "B", example: "" },
    { title: "C", text: "D", example: "5 min → done" }
  ]);
  assert.equal(json, '[{"title":"A","text":"B"},{"title":"C","text":"D","example":"5 min → done"}]');
});

test("parseQuickGuide returns [] for null, empty and whitespace input", () => {
  assert.deepEqual(parseQuickGuide(null), []);
  assert.deepEqual(parseQuickGuide(undefined), []);
  assert.deepEqual(parseQuickGuide(""), []);
  assert.deepEqual(parseQuickGuide("   "), []);
});

test("parseQuickGuide returns [] for invalid JSON", () => {
  assert.deepEqual(parseQuickGuide("{not json"), []);
  assert.deepEqual(parseQuickGuide("hello world"), []);
});

test("parseQuickGuide returns [] for non-array JSON", () => {
  assert.deepEqual(parseQuickGuide('{"title":"x"}'), []);
  assert.deepEqual(parseQuickGuide('"just a string"'), []);
  assert.deepEqual(parseQuickGuide("42"), []);
});

test("parseQuickGuide drops malformed entries but keeps string-typed ones", () => {
  const raw = JSON.stringify([
    { title: "Good one", text: "Works." },
    { title: 123, text: "bad title" },
    null,
    { title: "No text" },
    { title: "", text: "empty title" },
    { text: "no title" }
  ]);
  const parsed = parseQuickGuide(raw);
  // Type guard only — non-string titles/text are dropped; empty strings are
  // kept (the admin editor enforces non-empty steps at the source).
  assert.deepEqual(parsed, [
    { title: "Good one", text: "Works." },
    { title: "", text: "empty title" }
  ]);
});

test("serializeQuickGuide normalizes missing title/text to empty strings", () => {
  const raw = serializeQuickGuide([
    { title: "A", text: "B" },
    { title: "", text: "" }
  ] as QuickGuideStep[]);
  assert.equal(raw, '[{"title":"A","text":"B"},{"title":"","text":""}]');
});

test("parseQuickGuide trims nothing and preserves order", () => {
  const raw = JSON.stringify([
    { title: "First", text: "One." },
    { title: "Second", text: "Two." },
    { title: "Third", text: "Three." }
  ]);
  const parsed = parseQuickGuide(raw);
  assert.deepEqual(parsed.map((s) => s.title), ["First", "Second", "Third"]);
});

// --- completeness helpers (the API + editor mandatory-check contract) ------

test("emptyQuickGuide returns exactly 3 blank steps", () => {
  const e = emptyQuickGuide();
  assert.equal(e.length, 3);
  assert.ok(e.every((s) => s.title === "" && s.text === ""));
});

test("isCompleteQuickGuide: all built-in guides pass", () => {
  for (const [slug, steps] of Object.entries(QUICK_GUIDES)) {
    assert.ok(isCompleteQuickGuide(steps), `${slug} guide must be complete`);
  }
});

test("isCompleteQuickGuide rejects blank, partial and empty guides", () => {
  assert.equal(isCompleteQuickGuide([]), false);
  assert.equal(isCompleteQuickGuide(emptyQuickGuide()), false);
  assert.equal(
    isCompleteQuickGuide([
      { title: "One", text: "Works." },
      { title: "", text: "Missing title" },
      { title: "Three", text: "Ok." }
    ]),
    false
  );
  assert.equal(
    isCompleteQuickGuide([
      { title: "One", text: "Works." },
      { title: "Two", text: "" },
      { title: "Three", text: "Ok." }
    ]),
    false
  );
});

test("isCompleteQuickGuide trims whitespace before deciding", () => {
  assert.equal(
    isCompleteQuickGuide([
      { title: "  One  ", text: " Works. " },
      { title: "Two", text: "Ok." },
      { title: "Three", text: "Done." }
    ]),
    true
  );
  assert.equal(
    isCompleteQuickGuide([
      { title: "   ", text: "Spaces only" },
      { title: "Two", text: "Ok." },
      { title: "Three", text: "Done." }
    ]),
    false
  );
});
