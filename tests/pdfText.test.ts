import { test } from "node:test";
import assert from "node:assert/strict";
import { toPdfSafe, clampPdfText, pdfDate } from "../lib/pdf-text.ts";
import { sanitizeRows, clampStr } from "../lib/history-utils.ts";

test("toPdfSafe: keeps WinAnsi-safe ASCII and Latin-1 characters", () => {
  assert.equal(toPdfSafe("Hello, world 123!"), "Hello, world 123!");
  assert.equal(toPdfSafe("café — crème brûlée"), "café - crème brûlée");
  assert.equal(toPdfSafe("é"), "é");
});

test("toPdfSafe: replaces symbols and unicode outside WinAnsi", () => {
  assert.equal(toPdfSafe("×"), "x");
  assert.equal(toPdfSafe("÷"), "/");
  assert.equal(toPdfSafe("°C"), "degC");
  assert.equal(toPdfSafe("30–45 min"), "30-45 min");
  assert.equal(toPdfSafe("—"), "-");
  assert.equal(toPdfSafe("“quoted”"), '"quoted"');
  assert.equal(toPdfSafe("👇emoji"), "?emoji");
});

test("toPdfSafe: does not throw on empty or nullish-ish input", () => {
  assert.equal(toPdfSafe(""), "");
});

test("clampPdfText: truncates long strings with an ellipsis", () => {
  assert.equal(clampPdfText("short", 10), "short");
  assert.equal(clampPdfText("a very long recipe name here", 10), "a very lo…");
});

test("pdfDate: formats ISO and SQLite datetimes to YYYY-MM-DD", () => {
  assert.equal(pdfDate("2026-08-03T12:30:00Z"), "2026-08-03");
  assert.equal(pdfDate("2026-08-03 12:00:00"), "2026-08-03");
  assert.equal(pdfDate("garbage"), "garbage");
});

test("clampStr: trims and caps strings", () => {
  assert.equal(clampStr("  hello  ", 10), "hello");
  assert.equal(clampStr("x".repeat(200), 10), "x".repeat(10));
  assert.equal(clampStr(null, 10), "");
  assert.equal(clampStr(undefined, 10), "");
  assert.equal(clampStr(123, 10), "123");
});

test("sanitizeRows: normalizes rows, drops empty ones, caps the total", () => {
  const rows = [
    { label: "  Calories ", value: " 550 kcal", sub: "per serving" },
    { label: "", value: "" },
    { label: "Protein", value: " 31 g " },
    { value: "orphan value kept" }
  ];
  const out = sanitizeRows(rows, 80);
  assert.equal(out.length, 3);
  assert.deepEqual(out[0], { label: "Calories", value: "550 kcal", sub: "per serving" });
  assert.deepEqual(out[1], { label: "Protein", value: "31 g", sub: "" });
  assert.deepEqual(out[2], { label: "", value: "orphan value kept", sub: "" });
});

test("sanitizeRows: rejects non-arrays and caps row count", () => {
  assert.deepEqual(sanitizeRows("not an array"), []);
  assert.deepEqual(sanitizeRows(null), []);
  assert.deepEqual(sanitizeRows(undefined), []);
  const many = Array.from({ length: 100 }, (_, i) => ({ label: `r${i}`, value: "1" }));
  assert.equal(sanitizeRows(many, 80).length, 80);
});
