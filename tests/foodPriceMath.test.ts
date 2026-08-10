import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PRICE_MAP,
  FOOD_PRICES,
  normalizeFoodName,
  findPricePerKg,
  estimateCost
} from "../components/tools/foodPrices.ts";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !== ${b}`);

test("foodPrices: curated list ships with 50+ common foods", () => {
  assert.ok(FOOD_PRICES.length >= 50, `expected >= 50 foods, got ${FOOD_PRICES.length}`);
  const names = new Set(FOOD_PRICES.map((p) => p.name));
  assert.equal(names.size, FOOD_PRICES.length, "food names must be unique");
  for (const p of FOOD_PRICES) {
    assert.ok(p.pricePerKg > 0, `${p.name} must have a positive price`);
    assert.ok(p.name.trim().length > 0);
  }
});

test("normalizeFoodName: trims, lowercases and collapses whitespace", () => {
  assert.equal(normalizeFoodName("  Chicken Breast  "), "chicken breast");
  assert.equal(normalizeFoodName("White   Rice (dry)"), "white rice (dry)");
  assert.equal(normalizeFoodName(""), "");
});

test("findPricePerKg: exact match by name", () => {
  assert.equal(findPricePerKg("Chicken breast (raw)", PRICE_MAP), 7.5);
  assert.equal(findPricePerKg("Olive oil", PRICE_MAP), 12);
});

test("findPricePerKg: case and whitespace tolerant", () => {
  assert.equal(findPricePerKg("  chicken breast (raw) ", PRICE_MAP), 7.5);
  assert.equal(findPricePerKg("Cheddar Cheese", PRICE_MAP), 11);
});

test("findPricePerKg: singular/plural fallback (Tomatoes → Tomato)", () => {
  assert.equal(findPricePerKg("Tomatoes", PRICE_MAP), PRICE_MAP["Tomato"]);
  assert.equal(findPricePerKg("tomatoes", PRICE_MAP), PRICE_MAP["Tomato"]);
});

test("findPricePerKg: unaliased plural resolves to its singular (peas → Peas (frozen))", () => {
  assert.equal(findPricePerKg("peas", PRICE_MAP), PRICE_MAP["Peas (frozen)"]);
  assert.equal(findPricePerKg("mushrooms", PRICE_MAP), PRICE_MAP["Mushrooms"]);
  assert.equal(findPricePerKg("Almonds", PRICE_MAP), PRICE_MAP["Almonds"]);
});

test("findPricePerKg: substring fallback for long names", () => {
  // Visitor types "chicken breast" — should match "Chicken breast (raw)".
  assert.equal(findPricePerKg("chicken breast", PRICE_MAP), 7.5);
});

test("findPricePerKg: unknown food returns undefined", () => {
  assert.equal(findPricePerKg("Unicorn steak", PRICE_MAP), undefined);
  assert.equal(findPricePerKg("", PRICE_MAP), undefined);
});

test("estimateCost: 600 g chicken at $7.50/kg = $4.50", () => {
  close(estimateCost(600, 7.5), 4.5);
});

test("estimateCost: 1000 g rice at $2.50/kg = $2.50", () => {
  close(estimateCost(1000, 2.5), 2.5);
});

test("estimateCost: 250 g butter at $9/kg = $2.25", () => {
  close(estimateCost(250, 9), 2.25);
});

test("estimateCost: zero or negative inputs cost nothing", () => {
  assert.equal(estimateCost(0, 5), 0);
  assert.equal(estimateCost(-100, 5), 0);
  assert.equal(estimateCost(200, 0), 0);
  assert.equal(estimateCost(200, undefined), 0);
  assert.equal(estimateCost(200, NaN), 0);
});

test("estimateCost: real price flow — Chicken breast (raw) 600 g", () => {
  const perKg = findPricePerKg("Chicken breast (raw)", PRICE_MAP)!;
  close(estimateCost(600, perKg), 4.5);
});

test("recipe cost round-trip: 500 g ground beef at $8.50/kg = $4.25", () => {
  close(estimateCost(500, PRICE_MAP["Ground beef"]), 4.25);
});
