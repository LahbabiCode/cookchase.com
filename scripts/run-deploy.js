#!/usr/bin/env node
/**
 * CookChase — background deploy runner.
 *
 * Spawned (detached) by POST /api/admin/deploy so the HTTP request returns
 * immediately while the actual deploy — npm build, backups, SSH sync — runs
 * in the background. The UI polls GET /api/admin/deploy and shows the live
 * status + log tail.
 *
 * Usage:
 *   node scripts/run-deploy.js <deploymentId> <env> <action>
 *
 *   env    — '' | staging | prod | pipeline
 *   action — deploy (runs deploy.sh) | check (--check-only)
 *
 * The result is written back into the `deployments` table. Because this runs
 * as its own process it must resolve the SQLite path exactly like lib/db.ts.
 */
"use strict";

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

// --- Resolve the DB path identically to lib/db.ts ---------------------------
const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
const dbPath =
  process.env.DATABASE_PATH || path.join(dataDir, "cookchase.db");

const [, , idArg, envArg, actionArg] = process.argv;
const id = Number(idArg);
const env = envArg || "";
const action = actionArg || "deploy";

function fail(msg) {
  console.error(`[run-deploy] ${msg}`);
  process.exit(1);
}

if (!Number.isInteger(id) || id <= 0) fail(`invalid deployment id: ${idArg}`);
if (!["", "staging", "prod", "pipeline"].includes(env)) fail(`invalid env: ${envArg}`);
if (!["deploy", "check", "dryrun"].includes(action)) fail(`invalid action: ${actionArg}`);

// Open the DB first so a schema/init failure is reported before any deploy
// work (getDb() runs schema creation + seeding on first open).
let db;
try {
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  // Ensure the table exists (lib/db.ts normally owns schema creation).
  db.exec(`
    CREATE TABLE IF NOT EXISTS deployments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      env TEXT NOT NULL DEFAULT '',
      action TEXT NOT NULL DEFAULT 'deploy',
      status TEXT NOT NULL DEFAULT 'running',
      http_code TEXT NOT NULL DEFAULT '',
      exit_code INTEGER NOT NULL DEFAULT -1,
      log_tail TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL DEFAULT '',
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      finished_at TEXT NOT NULL DEFAULT '',
      duration_ms INTEGER NOT NULL DEFAULT 0
    );
  `);
  const row = db.prepare("SELECT id FROM deployments WHERE id = ?").get(id);
  if (!row) fail(`deployment #${id} not found in the database`);
} catch (err) {
  fail(`cannot open the database at ${dbPath}: ${err.message}`);
}

// --- Build the deploy.sh command -------------------------------------------
const args = [path.join(process.cwd(), "deploy.sh")];
if (action === "check") {
  args.push("--check-only");
  if (env) args.push("--env", env);
} else {
  if (env === "pipeline") args.push("--pipeline", "--yes"); // non-interactive
  else if (env) args.push("--env", env);
  if (action === "dryrun") args.push("--dry-run"); // preview steps, touch nothing
}

// --- Locate bash -------------------------------------------------------------
// deploy.sh is a bash script. On Linux/macOS `bash` is on PATH; on Windows the
// app may run under cmd/PowerShell where Git Bash lives in Program Files and
// `bash` alone would not resolve. Try the common Git-for-Windows locations.
const BASH_CANDIDATES = [
  process.env.SHELL && /bash/.test(process.env.SHELL) ? process.env.SHELL : null,
  "bash",
  "C:\\Program Files\\Git\\bin\\bash.exe",
  "C:\\Program Files\\Git\\usr\\bin\\bash.exe",
  "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
  "C:\\Program Files\\Git\\git-bash.exe"
].filter(Boolean);

let bash = BASH_CANDIDATES[0];
for (const candidate of BASH_CANDIDATES) {
  try {
    // Synchronous, exits fast — confirms the binary exists and runs.
    require("child_process").execFileSync(candidate, ["--version"], {
      stdio: "ignore"
    });
    bash = candidate;
    break;
  } catch {
    /* try the next candidate */
  }
}
if (!bash) fail("could not find bash — deploy.sh requires a bash interpreter (Git Bash on Windows).");

const child = spawn(bash, args, {
  cwd: process.cwd(),
  env: { ...process.env, BASH_ENV: "" },
  stdio: ["ignore", "pipe", "pipe"]
});

let log = "";
const started = Date.now();

const update = (status, exitCode) => {
  const httpMatch = [...log.matchAll(/HTTP (\d{3})/g)];
  const httpCode = httpMatch.length ? httpMatch[httpMatch.length - 1][1] : "000";
  const tail = log.slice(-6000);
  const finishedAt = new Date().toISOString();
  try {
    db.prepare(
      `UPDATE deployments
       SET status = ?, http_code = ?, exit_code = ?, log_tail = ?,
           finished_at = ?, duration_ms = ?
       WHERE id = ?`
    ).run(status, httpCode, exitCode, tail, finishedAt, Date.now() - started, id);
    db.close();
  } catch (err) {
    console.error(`[run-deploy] failed to record result: ${err.message}`);
  }
};

child.stdout.on("data", (d) => {
  const s = d.toString();
  log += s;
  process.stdout.write(s);
});
child.stderr.on("data", (d) => {
  const s = d.toString();
  log += s;
  process.stderr.write(s);
});

// A non-zero exit from deploy.sh is a failed deploy (its own checks already
// printed the reason). Exit 0 with HTTP 000 is treated as success — deploy.sh
// only exits 0 after verification passed.
child.on("error", (err) => {
  log += `\n[run-deploy] failed to start deploy.sh: ${err.message}\n`;
  update("failed", 1);
  process.exit(1);
});

child.on("close", (code) => {
  const status = code === 0 ? "success" : "failed";
  update(status, code === null ? -1 : code);
  process.exit(0);
});
