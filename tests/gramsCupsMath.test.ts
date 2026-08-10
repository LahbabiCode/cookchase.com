import { test } from "node:test";
import assert from "node:assert/strict";

import { DENSITY_MAP } from "../components/tools/densities.ts";
import {
  CUP_TO_TBSP,
  CUP_TO_TSP,
  cupToUnitFactor,
  volumeToGrams,
  gramsToVolume,
  gramsEquivalents,
  densityFor
} from "../components/tools/gramsCupsMath.ts";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !== ${b}`);

test("cupToUnitFactor: US cup = 1, tbsp = 16, tsp = 48", () => {
  assert.equal(cupToUnitFactor("cup"), 1);
  assert.equal(cupToUnitFactor("tbsp"), CUP_TO_TBSP);
  assert.equal(cupToUnitFactor("tsp"), CUP_TO_TSP);
});

test("volumeToGrams: 1 cup all-purpose flour = 125 g", () => {
  const gPerCup = DENSITY_MAP["All-purpose flour"];
  assert.equal(gPerCup, 125);
  close(volumeToGrams(1, gPerCup, "cup"), 125);
});

test("volumeToGrams: 2 cups honey = 680 g (340 g/cup)", () => {
  close(volumeToGrams(2, DENSITY_MAP["Honey"], "cup"), 680);
});

test("volumeToGrams: 1 tbsp flour = 125/16 g", () => {
  close(volumeToGrams(1, 125, "tbsp"), 125 / CUP_TO_TBSP);
});

test("volumeToGrams: 1 tsp flour = 125/48 g", () => {
  close(volumeToGrams(1, 125, "tsp"), 125 / CUP_TO_TSP);
});

test("volumeToGrams: water density 236.6 g/cup (US cup)", () => {
  close(volumeToGrams(1, DENSITY_MAP["Water"], "cup"), 236.6, 1e-9);
});

test("gramsToVolume: 250 g flour = 2 cups", () => {
  close(gramsToVolume(250, 125, "cup"), 2);
});

test("gramsToVolume: 125 g flour = 8 tablespoons", () => {
  close(gramsToVolume(125, 125, "tbsp"), CUP_TO_TBSP);
});

test("gramsEquivalents: 125 g flour = 1 cup = 16 tbsp = 48 tsp", () => {
  const eq = gramsEquivalents(125, 125);
  close(eq.cups, 1);
  close(eq.tbsp, CUP_TO_TBSP);
  close(eq.tsp, CUP_TO_TSP);
});

test("round-trip: grams → cups → grams returns the original weight", () => {
  for (const g of [50, 125, 340, 999.5]) {
    const cups = gramsToVolume(g, 125, "cup");
    close(volumeToGrams(cups, 125, "cup"), g, 1e-6);
  }
});

test("densityFor: falls back to 125 g/cup for unknown ingredients", () => {
  assert.equal(densityFor("Mystery powder", DENSITY_MAP), 125);
});

test("densityFor: returns the mapped density when known", () => {
  assert.equal(densityFor("Granulated sugar", DENSITY_MAP), 200);
  assert.equal(densityFor("Honey", DENSITY_MAP), 340);
});
