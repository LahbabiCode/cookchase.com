import { test } from "node:test";
import assert from "node:assert/strict";

import {
  encodeComparison,
  decodeComparison,
  buildShareUrl,
  buildSocialLinks,
  SHARE_TEXT,
  type SharedRecipe
} from "../lib/comparison-share.ts";

const recipe = (over: Partial<SharedRecipe> = {}): SharedRecipe => ({
  name: "Garlic chicken & rice",
  servings: "4",
  prep: "15",
  cook: "30",
  ingredients: [
    { food: "Chicken breast (raw)", grams: "600", price: "5", packageSize: "600" },
    { food: "White rice (dry)", grams: "200", price: "", packageSize: "1000" }
  ],
  ...over
});

test("round-trip preserves the full three-recipe comparison", () => {
  const recipes = [
    recipe(),
    recipe({ name: "Beef tacos", servings: "6", prep: "10", cook: "15" }),
    recipe({ name: "Veggie stir-fry", ingredients: [{ food: "Tofu (firm)", grams: "400", price: "1.6", packageSize: "400" }] })
  ];
  const enc = encodeComparison(recipes);
  assert.deepEqual(decodeComparison(enc), recipes);
});

test("encoded string is URL-safe (no + / or padding)", () => {
  const enc = encodeComparison([recipe()]);
  assert.ok(enc.length > 0);
  assert.ok(!enc.includes("+"), "must not contain +");
  assert.ok(!enc.includes("/"), "must not contain /");
  assert.ok(!enc.includes("="), "must not contain =");
  assert.match(enc, /^[A-Za-z0-9_-]+$/);
});

test("round-trip preserves unicode recipe names", () => {
  const recipes = [recipe({ name: "Pasta al pomodoro 🍝" })];
  assert.deepEqual(decodeComparison(encodeComparison(recipes)), recipes);
});

test("blank price fields survive the round-trip as empty strings", () => {
  const recipes = [recipe({ ingredients: [{ food: "Broccoli", grams: "300", price: "", packageSize: "500" }] })];
  const decoded = decodeComparison(encodeComparison(recipes));
  assert.equal(decoded![0].ingredients[0].price, "");
});

test("unknown ingredient food falls back to a safe default on decode", () => {
  const enc = encodeComparison([
    recipe({ ingredients: [{ food: "Unicorn steak", grams: "100", price: "", packageSize: "100" }] })
  ]);
  const decoded = decodeComparison(enc)!;
  assert.equal(decoded[0].ingredients[0].food, "Egg (large)");
});

test("oversized ingredient lists are capped when encoding", () => {
  const many = Array.from({ length: 40 }, (_, i) => ({
    food: "Broccoli",
    grams: String(100 + i),
    price: "",
    packageSize: "500"
  }));
  const enc = encodeComparison([recipe({ ingredients: many })]);
  assert.equal(decodeComparison(enc)![0].ingredients.length, 24);
});

test("malformed or hostile input decodes to null, never throws", () => {
  assert.equal(decodeComparison(null), null);
  assert.equal(decodeComparison(""), null);
  assert.equal(decodeComparison("!!not-base64!!"), null);
  assert.equal(decodeComparison("aGVsbG8"), null); // valid b64, invalid JSON
  // Wrong version number.
  const v2 = btoa(JSON.stringify({ v: 99, r: [{ n: "X" }] }));
  assert.equal(decodeComparison(v2), null);
  // Correct version but implausible shape.
  const badShape = btoa(JSON.stringify({ v: 1, r: "nope" }));
  assert.equal(decodeComparison(badShape), null);
  // Too many recipes.
  const tooMany = btoa(JSON.stringify({ v: 1, r: [{ n: "A" }, { n: "B" }, { n: "C" }, { n: "D" }] }));
  assert.equal(decodeComparison(tooMany), null);
});

test("oversized encoded payloads are rejected before parsing", () => {
  const big = "A".repeat(7000);
  assert.equal(decodeComparison(big), null);
});

test("buildShareUrl appends ?cmp= or &cmp= correctly", () => {
  assert.equal(buildShareUrl("https://cookchase.com/tools/recipe-comparator", "abc"), "https://cookchase.com/tools/recipe-comparator?cmp=abc");
  assert.equal(buildShareUrl("https://cookchase.com/tools/recipe-comparator?utm=x", "abc"), "https://cookchase.com/tools/recipe-comparator?utm=x&cmp=abc");
});

test("buildSocialLinks encodes the URL and share text into each intent", () => {
  const links = buildSocialLinks("https://cookchase.com/tools/recipe-comparator?cmp=abc");
  assert.match(links.x, /^https:\/\/twitter\.com\/intent\/tweet\?/);
  assert.ok(links.x.includes(encodeURIComponent(SHARE_TEXT)));
  assert.ok(links.x.includes(encodeURIComponent("https://cookchase.com/tools/recipe-comparator?cmp=abc")));
  assert.equal(links.facebook, `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://cookchase.com/tools/recipe-comparator?cmp=abc")}`);
  assert.match(links.whatsapp, /^https:\/\/wa\.me\/\?text=/);
});

test("generated share link stays compact enough for social platforms", () => {
  const recipes = [recipe(), recipe(), recipe()];
  const enc = encodeComparison(recipes);
  const url = buildShareUrl("https://cookchase.com/tools/recipe-comparator", enc);
  assert.ok(url.length < 1200, `URL too long: ${url.length} chars`);
});
