import { test } from "node:test";
import assert from "node:assert/strict";

import {
  METHODS,
  ESPRESSO_STYLES,
  brewRatio,
  isBalancedRatio,
  brewStrength,
  espressoYieldPerShot,
  espressoTotals,
  GOLDEN_RULE_RATIO
} from "../components/tools/coffeeMath.ts";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !== ${b}`);

test("brewRatio: 320 ml water over 20 g coffee is exactly 1:16", () => {
  close(brewRatio(320, 20), 16);
});

test("brewRatio: 1000 ml over 60 g is the golden rule ≈ 1:16.67", () => {
  close(brewRatio(1000, 60), GOLDEN_RULE_RATIO, 1e-9);
});

test("brewRatio: zero coffee returns 0 (never divides by zero)", () => {
  assert.equal(brewRatio(320, 0), 0);
});

test("brewRatio: zero water returns 0", () => {
  assert.equal(brewRatio(0, 20), 0);
});

test("isBalancedRatio: 1:16 sits inside the pour-over 1:15–17 range", () => {
  const pourOver = METHODS.find((m) => m.id === "pour-over")!;
  assert.equal(isBalancedRatio(16, pourOver.ratio), true);
  assert.equal(isBalancedRatio(15, pourOver.ratio), true);
  assert.equal(isBalancedRatio(17, pourOver.ratio), true);
});

test("isBalancedRatio: outside range is not balanced", () => {
  const pourOver = METHODS.find((m) => m.id === "pour-over")!;
  assert.equal(isBalancedRatio(14.9, pourOver.ratio), false);
  assert.equal(isBalancedRatio(17.1, pourOver.ratio), false);
});

test("brewStrength: balanced / weak / strong classification", () => {
  const drip = METHODS.find((m) => m.id === "drip")!; // 1:15–18
  assert.equal(brewStrength(16.5, drip.ratio), "balanced");
  assert.equal(brewStrength(19, drip.ratio), "weak"); // too much water
  assert.equal(brewStrength(14, drip.ratio), "strong"); // not enough water
});

test("espressoYieldPerShot: normale 1:2 with 18 g dose yields 36 ml", () => {
  const normale = ESPRESSO_STYLES.find((s) => s.id === "normale")!;
  close(espressoYieldPerShot(18, normale.ratio[1]), 36);
});

test("espressoYieldPerShot: ristretto (1:1.5) and lungo (1:3) yields", () => {
  const ristretto = ESPRESSO_STYLES.find((s) => s.id === "ristretto")!;
  const lungo = ESPRESSO_STYLES.find((s) => s.id === "lungo")!;
  close(espressoYieldPerShot(18, ristretto.ratio[1]), 27);
  close(espressoYieldPerShot(18, lungo.ratio[1]), 54);
});

test("espressoTotals: 2 × 18 g normale shots give 36 g dose and 72 ml yield", () => {
  const normale = ESPRESSO_STYLES.find((s) => s.id === "normale")!;
  const totals = espressoTotals(18, normale.ratio[1], 2);
  close(totals.dose, 36);
  close(totals.yield, 72);
});

test("espressoTotals: 1 shot is the single-shot yield", () => {
  const normale = ESPRESSO_STYLES.find((s) => s.id === "normale")!;
  const totals = espressoTotals(18, normale.ratio[1], 1);
  close(totals.dose, 18);
  close(totals.yield, 36);
});

test("METHODS: every method has a valid ascending ratio", () => {
  for (const m of METHODS) {
    assert.ok(m.ratio[0] > 0, `${m.id} lower bound positive`);
    assert.ok(m.ratio[1] >= m.ratio[0], `${m.id} upper bound >= lower`);
  }
});

test("ESPRESSO_STYLES: ratios follow dose ≤ yield", () => {
  for (const s of ESPRESSO_STYLES) {
    assert.ok(s.ratio[1] >= s.ratio[0], `${s.id} yield multiplier >= 1`);
  }
});
