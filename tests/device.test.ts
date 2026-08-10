import { test } from "node:test";
import assert from "node:assert/strict";
import { parseUserAgent } from "../lib/device.ts";

test("desktop Chrome on Windows", () => {
  const d = parseUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
  );
  assert.equal(d.kind, "desktop");
  assert.equal(d.browser, "Chrome");
  assert.equal(d.os, "Windows");
  assert.equal(d.label, "Chrome on Windows");
  assert.equal(d.icon, "Laptop");
});

test("iPhone Safari counts as mobile iOS", () => {
  const d = parseUserAgent(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
  );
  assert.equal(d.kind, "mobile");
  assert.equal(d.browser, "Safari");
  assert.equal(d.os, "iOS");
  assert.match(d.label, /\(mobile\)/);
  assert.equal(d.icon, "Smartphone");
});

test("Android phone Chrome is mobile", () => {
  const d = parseUserAgent(
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36"
  );
  assert.equal(d.kind, "mobile");
  assert.equal(d.browser, "Chrome");
  assert.equal(d.os, "Android");
  assert.equal(d.icon, "Smartphone");
});

test("iPad is tablet", () => {
  const d = parseUserAgent(
    "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
  );
  assert.equal(d.kind, "tablet");
  assert.equal(d.os, "iOS");
  assert.equal(d.icon, "Tablet");
});

test("macOS Firefox is desktop", () => {
  const d = parseUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:127.0) Gecko/20100101 Firefox/127.0"
  );
  assert.equal(d.kind, "desktop");
  assert.equal(d.browser, "Firefox");
  assert.equal(d.os, "macOS");
});

test("Edge is detected before Chrome (Edg/ substring)", () => {
  const d = parseUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
  );
  assert.equal(d.browser, "Edge");
});

test("Linux desktop does not get the mobile suffix", () => {
  const d = parseUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
  );
  assert.equal(d.kind, "desktop");
  assert.equal(d.os, "Linux");
  assert.equal(d.label, "Chrome on Linux");
});

test("empty or unknown user agent degrades gracefully", () => {
  const empty = parseUserAgent("");
  assert.equal(empty.kind, "desktop");
  assert.equal(empty.browser, "Browser");
  assert.equal(empty.os, "Device");

  const nullish = parseUserAgent(null);
  assert.equal(nullish.kind, "desktop");
  assert.equal(nullish.label, "Browser on Device");
});

test("oversized user agents are truncated before parsing", () => {
  const huge = "Mozilla/5.0 (Windows NT 10.0) Chrome/126.0 ".repeat(100);
  const d = parseUserAgent(huge);
  assert.equal(typeof d.label, "string");
  assert.ok(d.label.length < 100);
});
