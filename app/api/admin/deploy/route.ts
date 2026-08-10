import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import { isAdminAuthed } from "@/lib/auth";
import {
  insertDeployment,
  listDeployments,
  getRunningDeployment,
  getDeployInfo,
  runHealthCheck,
  pruneDeployments,
  isValidEnv
} from "@/lib/deploy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Admin Deploy panel API.
 *
 * GET  — recent deployments + deployability info + lock state.
 * POST — body { env, action }:
 *   action "deploy" triggers deploy.sh in a detached background process and
 *          returns immediately (the UI polls GET for the live result).
 *   action "check"  runs the fast in-process health check synchronously and
 *          records it as a 'check' row in the log.
 */
export async function GET() {
  if (!isAdminAuthed()) return unauth();
  pruneDeployments(50);
  return NextResponse.json({
    deployments: listDeployments(15),
    running: getRunningDeployment(),
    info: getDeployInfo()
  });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();

  let body: { env?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const env: string = body.env ?? "";
  const action: string = body.action ?? "deploy";
  if (!isValidEnv(env)) {
    return NextResponse.json(
      { error: `Unknown environment '${env}' — expected '', staging, prod or pipeline` },
      { status: 400 }
    );
  }
  if (action !== "deploy" && action !== "check" && action !== "dryrun") {
    return NextResponse.json(
      { error: `Unknown action '${action}' — expected 'deploy', 'check' or 'dryrun'` },
      { status: 400 }
    );
  }

  // Health checks are cheap and run in-process — no deploy.sh needed. They're
  // recorded as immediately-completed rows (never "running"), so they appear in
  // the history log without ever tripping the single-deploy lock.
  if (action === "check") {
    const result = await runHealthCheck();
    const okCount = result.items.filter((i) => i.ok).length;
    insertDeployment(env, "check", "admin", {
      status: result.allOk ? "success" : "failed",
      log: `${okCount}/${result.items.length} checks passed — ${result.items
        .filter((i) => !i.ok)
        .map((i) => `${i.label} (HTTP ${i.status})`)
        .join(", ") || "all reachable"}.`
    });
    return NextResponse.json({
      ok: result.allOk,
      health: result,
      running: getRunningDeployment()
    });
  }

  // Real deploy: requires deploy.sh + a config file on this machine.
  const info = getDeployInfo();
  if (!info.available) {
    return NextResponse.json(
      { error: info.reason || "Deploy is not available in this environment." },
      { status: 400 }
    );
  }
  // Only one deploy at a time — a second request would corrupt the backups
  // and fight over the same SSH target.
  if (info.lockHeld) {
    return NextResponse.json(
      {
        error:
          "A deploy is already running. Wait for it to finish (or restart the server) before starting another."
      },
      { status: 409 }
    );
  }

  const row = insertDeployment(env, action === "dryrun" ? "dryrun" : "deploy", "admin");
  // Run the background recorder (scripts/run-deploy.js): it spawns deploy.sh,
  // captures the full log, then writes status/HTTP code/duration back to this
  // row. Detached + stdio ignore: the child outlives the request handler, and
  // the UI polls GET /api/admin/deploy to follow progress.
  const runner = path.join(process.cwd(), "scripts", "run-deploy.js");
  const child = spawn(process.execPath, [runner, String(row.id), env, action === "dryrun" ? "dryrun" : "deploy"], {
    cwd: process.cwd(),
    detached: true,
    stdio: "ignore",
    env: { ...process.env }
  });
  child.unref();

  return NextResponse.json({ ok: true, deployment: row }, { status: 202 });
}
