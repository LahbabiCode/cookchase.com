import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SETTINGS,
  sanitizeSettings,
  mergeSettings,
  settingsDifferFromDefaults
} from "../lib/settings-utils.ts";

test("defaults are metric, English, both layout modes off", () => {
  assert.equal(DEFAULT_SETTINGS.units, "metric");
  assert.equal(DEFAULT_SETTINGS.language, "en");
  assert.equal(DEFAULT_SETTINGS.easyMode, false);
  assert.equal(DEFAULT_SETTINGS.compactMode, false);
  assert.equal(DEFAULT_SETTINGS.easyContrast, false);
});

test("sanitizeSettings accepts valid values and fills gaps with defaults", () => {
  const s = sanitizeSettings({
    units: "imperial",
    easyMode: true,
    compactMode: true,
    easyContrast: true
  });
  assert.equal(s.units, "imperial");
  assert.equal(s.language, "en"); // untouched → default
  assert.equal(s.easyMode, true);
  assert.equal(s.compactMode, true);
  assert.equal(s.easyContrast, true);
});

test("sanitizeSettings rejects invalid values", () => {
  const s = sanitizeSettings({ units: "furlongs" as never, language: "fr" as never });
  assert.equal(s.units, DEFAULT_SETTINGS.units);
  assert.equal(s.language, "en");
});

test("sanitizeSettings keeps current values when patch omits them", () => {
  const current = {
    units: "imperial" as const,
    language: "en" as const,
    easyMode: true,
    compactMode: true,
    easyContrast: true
  };
  const s = sanitizeSettings({}, current);
  assert.equal(s.units, "imperial");
  assert.equal(s.easyMode, true);
  assert.equal(s.compactMode, true);
  assert.equal(s.easyContrast, true);
});

test("sanitizeSettings tolerates null, undefined and non-object input", () => {
  assert.deepEqual(sanitizeSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(sanitizeSettings(undefined), DEFAULT_SETTINGS);
  assert.deepEqual(sanitizeSettings("nonsense" as never), DEFAULT_SETTINGS);
});

test("sanitizeSettings coerces easyMode/compactMode strings to boolean fallback", () => {
  const s = sanitizeSettings({
    easyMode: "true" as never,
    compactMode: "1" as never,
    easyContrast: "1" as never
  });
  assert.equal(s.easyMode, false); // non-boolean → default off
  assert.equal(s.compactMode, false);
  assert.equal(s.easyContrast, false);
});

test("mergeSettings: server defaults adopt non-default local values", () => {
  const merged = mergeSettings(DEFAULT_SETTINGS, {
    units: "imperial",
    easyMode: true,
    compactMode: true,
    easyContrast: true
  });
  assert.equal(merged.units, "imperial");
  assert.equal(merged.easyMode, true);
  assert.equal(merged.compactMode, true);
  assert.equal(merged.easyContrast, true);
});

test("mergeSettings: server values win when already set (non-default)", () => {
  const server = {
    units: "imperial" as const,
    language: "en" as const,
    easyMode: true,
    compactMode: false,
    easyContrast: true
  };
  const merged = mergeSettings(server, {
    units: "metric",
    easyMode: false,
    compactMode: true,
    easyContrast: false
  });
  assert.equal(merged.units, "imperial"); // server wins — user set imperial
  assert.equal(merged.easyMode, true); // server wins — user set easy mode
  assert.equal(merged.compactMode, true); // server at default → local non-default adopted
  assert.equal(merged.easyContrast, true); // server wins — user set it on the account
});

test("mergeSettings: per-field, so mixed cases merge correctly", () => {
  // Server set units only; local set easy + compact + contrast. All survive
  // per-field.
  const server = {
    units: "imperial" as const,
    language: "en" as const,
    easyMode: false,
    compactMode: false,
    easyContrast: false
  };
  const merged = mergeSettings(server, {
    units: "metric",
    easyMode: true,
    compactMode: true,
    easyContrast: true
  });
  assert.equal(merged.units, "imperial"); // server already non-default
  assert.equal(merged.easyMode, true); // server default → local adopted
  assert.equal(merged.compactMode, true); // server default → local adopted
  assert.equal(merged.easyContrast, true); // server default → local adopted
});

test("mergeSettings ignores null local", () => {
  assert.deepEqual(mergeSettings(DEFAULT_SETTINGS, null), DEFAULT_SETTINGS);
});

test("settingsDifferFromDefaults detects any non-default value", () => {
  assert.equal(settingsDifferFromDefaults(DEFAULT_SETTINGS), false);
  assert.equal(settingsDifferFromDefaults({ ...DEFAULT_SETTINGS, units: "imperial" }), true);
  assert.equal(settingsDifferFromDefaults({ ...DEFAULT_SETTINGS, easyMode: true }), true);
  assert.equal(settingsDifferFromDefaults({ ...DEFAULT_SETTINGS, compactMode: true }), true);
  assert.equal(settingsDifferFromDefaults({ ...DEFAULT_SETTINGS, easyContrast: true }), true);
});

test("sanitizeSettings returns a fresh object (no shared mutation)", () => {
  const a = sanitizeSettings({ easyMode: true });
  const b = sanitizeSettings({});
  assert.equal(a.easyMode, true);
  assert.equal(b.easyMode, false);
  assert.notEqual(a, b);
});
