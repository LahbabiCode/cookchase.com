#!/usr/bin/env node
/**
 * Fixes a known Windows bug in Next.js's vendored @vercel/og:
 *   fileURLToPath(join(import.meta.url, "../noto-sans-v27-latin-regular.ttf"))
 * produces invalid URLs on Windows (backslash paths), crashing any `next/og`
 * ImageResponse route with "TypeError: Invalid URL".
 *
 * The fix replaces the broken path handling with a proper URL resolution.
 * The assets (font + wasm) live in the SAME directory as index.node.js, so the
 * correct reference is "./" — the original "../" is itself wrong and only
 * happened to work on Linux because path.join() normalized it.
 *
 * This only affects local Windows development; Linux/Vercel builds are fine.
 * Re-run after `npm install` upgrades Next.
 */
const fs = require("fs");
const path = require("path");

const targets = [
  path.join(
    process.cwd(),
    "node_modules",
    "next",
    "dist",
    "compiled",
    "@vercel",
    "og",
    "index.node.js"
  ),
  path.join(
    process.cwd(),
    "node_modules",
    "next",
    "dist",
    "compiled",
    "@vercel",
    "og",
    "index.edge.js"
  )
];

let changed = 0;
for (const file of targets) {
  if (!fs.existsSync(file)) {
    console.log(`SKIP (missing): ${file}`);
    continue;
  }
  const original = fs.readFileSync(file, "utf8");
  // Handle both the original broken form and any previously patched form.
  const fixed = original
    .replace(
      /fileURLToPath\(join\(import\.meta\.url,\s*"\.\.\/([^"]+)"\)\)/g,
      'fileURLToPath(new URL("./$1", import.meta.url))'
    )
    .replace(
      /fileURLToPath\(new URL\("\.\.\/([^"]+)",\s*import\.meta\.url\)\)/g,
      'fileURLToPath(new URL("./$1", import.meta.url))'
    );
  if (fixed === original) {
    console.log(`OK (already patched or no match): ${file}`);
    continue;
  }
  fs.writeFileSync(file, fixed);
  changed++;
  console.log(`PATCHED: ${file}`);
}

if (changed === 0) {
  console.log("No files needed patching.");
} else {
  console.log(`Patched ${changed} file(s). Restart the Next server to apply.`);
}
