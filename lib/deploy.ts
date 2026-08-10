import fs from "fs";
import path from "path";
import { getDb } from "./db";
import { getSetting, getSiteUrl } from "./queries";

/**
 * Admin "Deploy now" support. The heavy work (npm build, backups, SSH sync)
 * runs in a detached background process (scripts/run-deploy.js) that records
 * its result back into the `deployments` table; this module is the server-side
 * API for that table plus a fast in-process health check for the UI.
 */

export interface DeploymentRow {
  id: number;
  env: string;
  action: "deploy" | "check" | "dryrun";
  status: "running" | "success" | "failed";
  http_code: string;
  exit_code: number;
  log_tail: string;
  created_by: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
}

const VALID_ENVS = ["", "staging", "prod", "pipeline"] as const;
export type DeployEnv = (typeof VALID_ENVS)[number];

export function isValidEnv(env: string): env is DeployEnv {
  return (VALID_ENVS as readonly string[]).includes(env);
}

/** A config file is considered present only when it has real content. */
function envConfigExists(env: string): boolean {
  const file =
    env === "" ? ".env.deploy" : `.env.deploy.${env}`;
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    return raw.trim().length > 0;
  } catch {
    return false;
  }
}

export interface DeployInfo {
  available: boolean; // deploy.sh exists + a usable config exists
  reason: string;
  scriptPresent: boolean;
  configs: Record<string, boolean>; // env -> config file present
  siteUrl: string;
  lockHeld: boolean;
}

/**
 * Whether a deploy can be triggered from this environment at all. This only
 * makes sense where the repo lives (own VPS / local machine with deploy.sh and
 * the .env.deploy* files). On Vercel/Railway there is no bash/SSH and no config
 * files, so the panel shows the reason instead of a broken button.
 */
export function getDeployInfo(): DeployInfo {
  const cwd = process.cwd();
  const scriptPresent = fs.existsSync(path.join(cwd, "deploy.sh"));
  const configs: Record<string, boolean> = {};
  for (const env of VALID_ENVS) configs[env] = envConfigExists(env);
  // Default (single-env) deploys need either a config or inline env vars —
  // the panel can't pass inline env, so a config file is required here.
  const hasUsable = scriptPresent && (configs["staging"] || configs["prod"] || configs[""]);

  let reason = "";
  if (!scriptPresent) {
    reason =
      "deploy.sh was not found in the project root. This panel works on your own VPS or local machine where the deploy script and .env.deploy* config files live — not on serverless hosts like Vercel/Railway.";
  } else if (!hasUsable) {
    reason =
      "deploy.sh exists but no .env.deploy config was found. Copy the templates (cp .env.deploy.prod.example .env.deploy.prod) and fill in your server details.";
  }

  return {
    available: hasUsable,
    reason,
    scriptPresent,
    configs,
    siteUrl: getSiteUrl(),
    lockHeld: getRunningDeployment() !== null
  };
}

// --- Deployments table -------------------------------------------------------

export function insertDeployment(
  env: string,
  action: "deploy" | "check" | "dryrun",
  createdBy: string,
  opts: { status?: "running" | "success" | "failed"; log?: string } = {}
): DeploymentRow {
  const status = opts.status ?? "running";
  const info = getDb()
    .prepare(
      `INSERT INTO deployments (env, action, status, created_by, log_tail, finished_at, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, 0)`
    )
    .run(
      env,
      action,
      status,
      createdBy,
      opts.log ?? "",
      status === "running" ? "" : new Date().toISOString()
    );
  const row = getDb()
    .prepare("SELECT * FROM deployments WHERE id = ?")
    .get(info.lastInsertRowid) as DeploymentRow;
  return row;
}

export function listDeployments(limit = 15): DeploymentRow[] {
  return getDb()
    .prepare("SELECT * FROM deployments ORDER BY id DESC LIMIT ?")
    .all(limit) as DeploymentRow[];
}

export function getRunningDeployment(): DeploymentRow | null {
  recoverStaleDeployments();
  const row = getDb()
    .prepare("SELECT * FROM deployments WHERE status = 'running' ORDER BY id DESC LIMIT 1")
    .get() as DeploymentRow | undefined;
  return row || null;
}

/**
 * Safety net: a deploy left marked "running" because the process died (server
 * restart, OOM, kill) would otherwise block the single-deploy lock forever.
 * Rows older than ~40 minutes are marked failed with a note. The runner's own
 * writes are far faster than that, so a genuinely busy deploy is never touched.
 */
function recoverStaleDeployments(): void {
  try {
    getDb()
      .prepare(
        `UPDATE deployments
         SET status = 'failed', finished_at = COALESCE(finished_at, datetime('now')),
             log_tail = CASE WHEN log_tail = '' THEN 'Abandoned: the deploy process stopped responding.' ELSE log_tail END
         WHERE status = 'running' AND julianday('now') - julianday(started_at) > 0.028`
      )
      .run();
  } catch {
    /* never let recovery fail the request */
  }
}

export function pruneDeployments(keep = 50): void {
  getDb()
    .prepare(
      "DELETE FROM deployments WHERE id NOT IN (SELECT id FROM deployments ORDER BY id DESC LIMIT ?)"
    )
    .run(keep);
}

// --- In-process health check (no SSH) ---------------------------------------

export interface HealthItem {
  label: string;
  path: string;
  status: number;
  ms: number;
  ok: boolean;
  note: string;
}

export interface HealthResult {
  checkedAt: string;
  siteUrl: string;
  items: HealthItem[];
  allOk: boolean;
}

async function probe(url: string, timeoutMs = 8000): Promise<{ status: number; ms: number; body: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "CookChase-Deploy-Checker/1.0" }
    });
    let body = "";
    try {
      body = (await res.text()).slice(0, 100_000);
    } catch {
      /* not text — fine */
    }
    return { status: res.status, ms: Date.now() - start, body };
  } catch {
    return { status: 0, ms: Date.now() - start, body: "" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fast health check mirroring deploy.sh's verify_deploy but done in-process
 * with fetch against the configured site URL — no SSH, so it also works on
 * serverless hosts. Checks the homepage, robots.txt → sitemap, sitemap.xml
 * host, and any extra paths stored in the deploy_check_paths setting.
 */
export async function runHealthCheck(): Promise<HealthResult> {
  const siteUrl = getSiteUrl();
  const host = siteUrl.replace(/^[a-z]+:\/\//, "").split(/[/:]/)[0];
  const extraPaths = (getSetting("deploy_check_paths") || "")
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const targets = [
    { label: "Homepage", path: "/", ok: (s: number) => s >= 200 && s < 400 },
    {
      label: "robots.txt",
      path: "/robots.txt",
      ok: (s: number, body: string) => s >= 200 && s < 400 && /sitemap:/i.test(body)
    },
    {
      label: "sitemap.xml",
      path: "/sitemap.xml",
      ok: (s: number, body: string) =>
        s >= 200 && s < 400 && body.includes("<urlset") && body.includes(host)
    },
    ...extraPaths.map((p) => ({
      label: `Check path ${p}`,
      path: p,
      ok: (s: number) => s >= 200 && s < 400
    }))
  ];

  const results = await Promise.all(
    targets.map((t) => probe(`${siteUrl}${t.path}`))
  );

  const items: HealthItem[] = targets.map((t, i) => {
    const { status, ms, body } = results[i];
    let note: string;
    if (status === 0) {
      note = "Unreachable — connection refused or request timed out.";
    } else if (t.path === "/robots.txt" && status >= 200 && status < 400) {
      note = /sitemap:/i.test(body)
        ? "Served and references the sitemap."
        : "Served but missing a 'Sitemap:' line.";
    } else if (t.path === "/sitemap.xml" && status >= 200 && status < 400) {
      note = body.includes("<urlset")
        ? body.includes(host)
          ? "Valid urlset serving URLs for the right host."
          : `Served but no URL mentions '${host}' — SITE_URL may be wrong.`
        : "Markup looks wrong — expected a <urlset>.";
    } else {
      note = `HTTP ${status} in ${ms} ms.`;
    }
    return {
      label: t.label,
      path: t.path,
      status,
      ms,
      ok: t.ok(status, body),
      note
    };
  });

  return {
    checkedAt: new Date().toISOString(),
    siteUrl,
    items,
    allOk: items.every((i) => i.ok)
  };
}
