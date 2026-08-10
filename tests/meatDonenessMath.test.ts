import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MEATS,
  TEMP_MIN,
  TEMP_MAX,
  thermometerPercent,
  pullTemp,
  fahrenheitToCelsius
} from "../components/tools/meatDonenessMath.ts";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !== ${b}`);

test("MEATS: 7 meats defined with stable ids", () => {
  assert.equal(MEATS.length, 7);
  const ids = MEATS.map((m) => m.id);
  assert.ok(new Set(ids).size === ids.length, "ids are unique");
});

test("MEATS: safeMinC matches fahrenheitToCelsius(safeMinF) for every meat", () => {
  for (const meat of MEATS) {
    assert.equal(
      meat.safeMinC,
      fahrenheitToCelsius(meat.safeMinF),
      `${meat.label} safe minimum °C`
    );
  }
});

test("MEATS: every doneness level has °C consistent with °F", () => {
  for (const meat of MEATS) {
    for (const d of meat.doneness) {
      assert.equal(
        d.tempC,
        fahrenheitToCelsius(d.tempF),
        `${meat.label} / ${d.label}: ${d.tempF}°F → ${d.tempC}°C`
      );
    }
  }
});

test("MEATS: doneness temps are non-decreasing within each meat (ties must differ by id)", () => {
  for (const meat of MEATS) {
    for (let i = 1; i < meat.doneness.length; i++) {
      const prev = meat.doneness[i - 1];
      const cur = meat.doneness[i];
      assert.ok(
        cur.tempF >= prev.tempF,
        `${meat.label} levels ascend: ${meat.doneness.map((d) => d.tempF).join(", ")}`
      );
      // A tie is only meaningful for distinct cuts (e.g. turkey whole vs breast).
      if (cur.tempF === prev.tempF) {
        assert.notEqual(cur.id, prev.id, `${meat.label}: tied levels have distinct ids`);
      }
    }
  }
});

test("MEATS: all temps fall inside the thermometer range", () => {
  for (const meat of MEATS) {
    for (const d of meat.doneness) {
      assert.ok(d.tempF >= TEMP_MIN && d.tempF <= TEMP_MAX, `${meat.label} ${d.label}`);
    }
  }
});

test("MEATS: poultry must not have doneness below the USDA 165°F minimum", () => {
  for (const id of ["chicken", "turkey"]) {
    const meat = MEATS.find((m) => m.id === id)!;
    for (const d of meat.doneness) {
      assert.ok(d.tempF >= meat.safeMinF, `${id} ${d.label} ≥ ${meat.safeMinF}°F`);
    }
  }
});

test("reference values: medium-rare steak = 135°F / 57°C", () => {
  const steak = MEATS.find((m) => m.id === "beef-steak")!;
  const medRare = steak.doneness.find((d) => d.id === "med-rare")!;
  assert.equal(medRare.tempF, 135);
  assert.equal(medRare.tempC, 57);
});

test("reference values: chicken breast = 165°F / 74°C", () => {
  const chicken = MEATS.find((m) => m.id === "chicken")!;
  const breast = chicken.doneness.find((d) => d.id === "breast")!;
  assert.equal(breast.tempF, 165);
  assert.equal(breast.tempC, 74);
  assert.equal(chicken.safeMinF, 165);
});

test("thermometerPercent: maps 135°F to ~31.8% and clamps at 0/100", () => {
  // (135 − 100) / (210 − 100) × 100 = 31.818…
  close(thermometerPercent(135), 31.8181818181818, 1e-6);
  assert.equal(thermometerPercent(TEMP_MIN), 0);
  assert.equal(thermometerPercent(TEMP_MAX), 100);
  assert.equal(thermometerPercent(50), 0); // below scale clamps to 0
  assert.equal(thermometerPercent(300), 100); // above scale clamps to 100
});

test("pullTemp: always 5°F below the target", () => {
  assert.equal(pullTemp(135), 130);
  assert.equal(pullTemp(165), 160);
  assert.equal(pullTemp(175), 170);
});

test("fahrenheitToCelsius: standard conversions", () => {
  assert.equal(fahrenheitToCelsius(32), 0);
  assert.equal(fahrenheitToCelsius(212), 100);
  assert.equal(fahrenheitToCelsius(135), 57); // 57.2 rounds to 57
  assert.equal(fahrenheitToCelsius(145), 63); // 62.8 rounds to 63
});
