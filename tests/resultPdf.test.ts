import { test } from "node:test";
import assert from "node:assert/strict";
import { buildResultsPdf } from "../lib/result-pdf.ts";

const sampleData = {
  siteName: "CookChase",
  generatedAt: "2026-08-03T12:00:00Z",
  toolName: "Water Intake Calculator",
  toolSlug: "water-intake",
  rows: [
    { label: "Total daily water", value: "2450 ml" },
    { label: "In liters", value: "2.45 L" },
    { label: "In cups", value: "10 cups (240 ml)" },
    { label: "Baseline (weight)", value: "2100 ml" },
    { label: "Exercise bonus", value: "+350 ml" }
  ]
};

test("buildResultsPdf: returns a valid PDF byte stream", async () => {
  const bytes = await buildResultsPdf(sampleData);
  assert.ok(bytes instanceof Uint8Array);
  assert.ok(bytes.length > 100, "PDF should be non-trivial in size");
  const head = Buffer.from(bytes.slice(0, 8)).toString("latin1");
  assert.match(head, /%PDF/);
});

test("buildResultsPdf: survives unicode and long rows without throwing", async () => {
  const bytes = await buildResultsPdf({
    ...sampleData,
    rows: [
      { label: "°F → °C", value: "350°F = 176.7°C", sub: "fan oven: 157°C" },
      { label: "A very long label that should be clamped gracefully", value: "…" },
      { label: "", value: "emoji 👇 test" }
    ]
  });
  assert.ok(bytes.length > 100);
  assert.match(Buffer.from(bytes.slice(0, 8)).toString("latin1"), /%PDF/);
});

test("buildResultsPdf: handles a very large row count", async () => {
  const rows = Array.from({ length: 150 }, (_, i) => ({
    label: `Ingredient ${i}`,
    value: `${i * 1.5} g`
  }));
  const bytes = await buildResultsPdf({ ...sampleData, rows });
  assert.ok(bytes.length > 200);
});

test("buildResultsPdf: handles empty rows", async () => {
  const bytes = await buildResultsPdf({ ...sampleData, rows: [] });
  assert.ok(bytes.length > 100);
  assert.match(Buffer.from(bytes.slice(0, 8)).toString("latin1"), /%PDF/);
});
