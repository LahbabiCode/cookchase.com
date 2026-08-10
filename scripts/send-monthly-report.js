#!/usr/bin/env node
/**
 * Trigger the monthly performance report email from any scheduler
 * (Railway, a VPS crontab, cron-job.org, GitHub Actions…).
 *
 *   SITE_URL=https://cookchase.com CRON_SECRET=... node scripts/send-monthly-report.js
 *   node scripts/send-monthly-report.js https://cookchase.com --secret=...
 *
 * The script exits 0 when the report was sent — or was legitimately skipped
 * (already sent this month / disabled), which is a normal, expected outcome.
 * It exits 1 only on a real failure so the scheduler can alert you.
 */

const SITE_URL = process.env.SITE_URL || "";
const CRON_SECRET = process.env.CRON_SECRET || "";

const args = process.argv.slice(2);
const positional = args.find((a) => !a.startsWith("--"));
const url = positional || SITE_URL;
const secretArg = args.find((a) => a.startsWith("--secret="))?.split("=")[1];
const secret = secretArg || CRON_SECRET;

function fail(code, msg) {
  console.error(`send-monthly-report: ${msg}`);
  process.exit(code);
}

if (!url) fail(2, "no URL. Usage: node scripts/send-monthly-report.js https://cookchase.com [--secret=...]");
if (!secret) fail(2, "CRON_SECRET is not set. Pass --secret=... or set the CRON_SECRET env var.");

const base = url.replace(/\/+$/, "");

fetch(`${base}/api/cron/monthly-report`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json"
  }
})
  .then(async (res) => {
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${body.error || res.statusText}`);
    }
    if (body.sent) {
      console.log(
        `Monthly report sent ✓ (${body.periodLabel || ""}) — ${body.status}`
      );
      console.log(`Attachments: ${(body.attachments || []).join(", ") || "none"}`);
      process.exit(0);
    }
    if (body.skipped) {
      console.log(`Skipped: ${body.reason}`);
      process.exit(0);
    }
    throw new Error(body.status || "Report send failed");
  })
  .catch((err) => fail(1, err.message));
