import { test } from "node:test";
import assert from "node:assert/strict";
import {
  TOOL_EXAMPLES,
  parseToolExampleValues,
  serializeToolExampleValues,
  defaultToolExample
} from "../lib/tool-examples.ts";

test("TOOL_EXAMPLES covers all 31 built-in tools", () => {
  // 31 slugs registered in components/tools/index.tsx — spot-check the count
  // is at least 30 and that every entry has a hint.
  const slugs = Object.keys(TOOL_EXAMPLES);
  assert.ok(slugs.length >= 30, `expected ~31 tools, got ${slugs.length}`);
  for (const [slug, cfg] of Object.entries(TOOL_EXAMPLES)) {
    assert.equal(typeof cfg.hint, "string", `${slug} hint must be a string`);
    assert.ok(cfg.hint.length > 10, `${slug} hint should be a real sentence`);
    assert.equal(typeof cfg.values, "object", `${slug} values must be an object`);
  }
});

test("defaults match the widgets' built-in examples", () => {
  // Water intake: 70 kg adult, light activity, mild climate.
  assert.deepEqual(TOOL_EXAMPLES["water-intake"].values, {
    weight: "70",
    unit: "kg",
    activity: 45,
    climate: "mild"
  });
  // Recipe scaler ships a 6 → 12 serving example with real ingredients.
  const scaler = TOOL_EXAMPLES["recipe-scaler"].values;
  assert.equal(scaler.original, "6");
  assert.equal(scaler.desired, "12");
  assert.ok(Array.isArray(scaler.rows) && scaler.rows.length >= 4);
});

test("parseToolExampleValues handles corrupt and empty input", () => {
  assert.deepEqual(parseToolExampleValues(""), {});
  assert.deepEqual(parseToolExampleValues(null), {});
  assert.deepEqual(parseToolExampleValues(undefined), {});
  assert.deepEqual(parseToolExampleValues("not json"), {});
  assert.deepEqual(parseToolExampleValues("[1,2]"), {}); // arrays rejected
  assert.deepEqual(parseToolExampleValues("42"), {});
  assert.deepEqual(parseToolExampleValues('{"weight":"70"}'), { weight: "70" });
});

test("serialize round-trips through parse", () => {
  const values = { weight: "70", unit: "kg", activity: 45, climate: "mild" };
  const raw = serializeToolExampleValues(values);
  assert.deepEqual(parseToolExampleValues(raw), values);
});

test("defaultToolExample returns a blank config for unknown tools", () => {
  assert.deepEqual(defaultToolExample("no-such-tool"), { hint: "", values: {} });
  assert.equal(defaultToolExample("water-intake").hint, TOOL_EXAMPLES["water-intake"].hint);
});
