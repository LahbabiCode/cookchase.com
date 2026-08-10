"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Rocket,
  RefreshCw,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  ScrollText,
  ChevronDown,
  ChevronUp,
  Clock,
  TriangleAlert,
  CircleDashed
} from "lucide-react";

interface Deployment {
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

interface HealthItem {
  label: string;
  path: string;
  status: number;
  ms: number;
  ok: boolean;
  note: string;
}

interface HealthResult {
  checkedAt: string;
  siteUrl: string;
  items: HealthItem[];
  allOk: boolean;
}

interface DeployInfo {
  available: boolean;
  reason: string;
  scriptPresent: boolean;
  configs: Record<string, boolean>;
  siteUrl: string;
  lockHeld: boolean;
  supportsCheck: boolean;
}

interface ApiState {
  deployments: Deployment[];
  running: Deployment | null;
  info: DeployInfo;
}

const ENV_LABELS: Record<string, string> = {
  "": "Default (.env.deploy)",
  staging: "Staging (.env.deploy.staging)",
  prod: "Production (.env.deploy.prod)",
  pipeline: "Pipeline (staging → prod)"
};

const fmtTime = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

const fmtDur = (ms: number) => {
  if (!ms) return "—";
  if (ms < 1000) return `${ms} ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
};

function StatusBadge({ status }: { status: Deployment["status"] }) {
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
        <Loader2 className="h-3 w-3 animate-spin" />
        Running
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Success
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
      <XCircle className="h-3 w-3" />
      Failed
    </span>
  );
}

export default function DeployPanel() {
  const [state, setState] = useState<ApiState | null>(null);
  const [env, setEnv] = useState("prod");

  // Environments whose config file exists on this machine. The API reports
  // per-env config presence; "pipeline" needs both staging and prod files.
  const availableEnvs = useMemo(() => {
    const c = state?.info.configs ?? {};
    return (Object.keys(ENV_LABELS) as Array<keyof typeof ENV_LABELS>).filter((e) => {
      if (e === "pipeline") return c.staging && c.prod;
      return c[e];
    });
  }, [state?.info.configs]);

  // If the selected env is no longer available (e.g. the config was removed),
  // fall back to the first configured one instead of failing confusingly.
  useEffect(() => {
    if (availableEnvs.length > 0 && !availableEnvs.includes(env as keyof typeof ENV_LABELS)) {
      setEnv(availableEnvs[0]);
    }
  }, [availableEnvs, env]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/deploy", { cache: "no-store" });
      if (res.ok) setState((await res.json()) as ApiState);
    } catch {
      /* transient — next poll will retry */
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Poll every 3s while a deploy is running; the UI follows the log tail live.
  useEffect(() => {
    const isRunning = state?.running;
    if (!isRunning) return;
    const t = setInterval(fetchState, 3000);
    return () => clearInterval(t);
  }, [state?.running, fetchState]);

  // Keep the live log scrolled to the newest line.
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "end" });
  }, [state?.running?.log_tail]);

  const doDeploy = async (action: "deploy" | "check" | "dryrun") => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ env, action })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "err", text: data.error || `Request failed (HTTP ${res.status})` });
        return;
      }
      if (action === "deploy") {
        setMessage({
          kind: "ok",
          text: `Deploy to ${env || "default"} started — follow the log below.`
        });
      } else if (action === "dryrun") {
        setMessage({
          kind: "ok",
          text: `Dry run for ${env || "default"} started — every step below is previewed, nothing is touched.`
        });
      } else {
        setHealth(data.health as HealthResult);
        const allOk = Boolean(data.health && data.health.allOk);
        setMessage({
          kind: "ok",
          text: allOk
            ? "Health check passed — everything is reachable and correct."
            : "Health check found problems — see the items below."
        });
      }
      await fetchState();
    } catch (e) {
      setMessage({ kind: "err", text: `Network error: ${(e as Error).message}` });
    } finally {
      setBusy(false);
    }
  };

  const running = state?.running ?? null;
  const canDeploy = state?.info.available ?? false;
  const deployingRow: Deployment | null =
    running?.action === "deploy" ? running : null;

  return (
    <div className="space-y-6">
      {/* --- Trigger card ---------------------------------------------------- */}
      <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <Rocket className="h-4 w-4 text-brand-600" />
              Deploy now
            </h2>
            <p className="mt-1 text-xs text-ink-500">
              Runs <code className="rounded bg-ink-100 px-1 font-mono">deploy.sh</code> with the
              selected environment — build, backups, SSH sync, restart and the built-in
              post-deploy verification. Use <em>Dry run</em> to preview every step without
              touching the server.
            </p>
          </div>
          {canDeploy && (
            <div className="flex items-center gap-2">
              <select
                value={env}
                onChange={(e) => setEnv(e.target.value)}
                disabled={!!deployingRow}
                title={
                  availableEnvs.length
                    ? undefined
                    : "No environment config found — copy a template and fill in your server details."
                }
                className="rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm font-medium text-ink-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-50"
              >
                {availableEnvs.length === 0 ? (
                  <option value="">No config found</option>
                ) : (
                  availableEnvs.map((value) => (
                    <option key={value} value={value}>
                      {ENV_LABELS[value]}
                    </option>
                  ))
                )}
              </select>
              <button
                onClick={() => doDeploy("dryrun")}
                disabled={busy || !!deployingRow}
                className="inline-flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm font-semibold text-ink-600 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                title="Preview every deploy step (build, backups, sync, checks) without SSH-ing to the server"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CircleDashed className="h-4 w-4" />}
                Dry run
              </button>
              <button
                onClick={() => doDeploy("deploy")}
                disabled={busy || !!deployingRow}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deployingRow ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4" />
                )}
                {deployingRow ? "Deploying…" : "Deploy now"}
              </button>
            </div>
          )}
        </div>

        {!canDeploy && state?.info && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Deploy is not available in this environment
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">{state.info.reason}</p>
            </div>
          </div>
        )}

        {deployingRow && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-blue-900">
              <Loader2 className="h-4 w-4 animate-spin" />
              Deploy #{deployingRow.id} running — {ENV_LABELS[deployingRow.env] || "default"}
            </p>
            <p className="mt-1 text-xs text-blue-700">
              Started {fmtTime(deployingRow.started_at)}. This page refreshes the log every 3
              seconds; you can leave and come back anytime.
            </p>
          </div>
        )}

        {message && (
          <div
            className={`mt-4 rounded-lg border p-3 text-sm ${
              message.kind === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Live log for the running deploy */}
        {deployingRow?.log_tail && (
          <div className="mt-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
              <ScrollText className="h-3.5 w-3.5" />
              Live output
            </p>
            <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-ink-900 p-4 font-mono text-xs leading-relaxed text-emerald-200">
              {deployingRow.log_tail}
              <div ref={logEndRef} />
            </pre>
          </div>
        )}
      </div>

      {/* --- Health check card ------------------------------------------------ */}
      <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <Activity className="h-4 w-4 text-emerald-600" />
              Health check
            </h2>
            <p className="mt-1 text-xs text-ink-500">
              Probes{" "}
              <code className="rounded bg-ink-100 px-1 font-mono">
                {state?.info.siteUrl || "site URL"}
              </code>{" "}
              — homepage, robots.txt → sitemap, sitemap.xml host, and any paths in the{" "}
              <em>deploy_check_paths</em> setting. No SSH required.
            </p>
          </div>
          <button
            onClick={() => doDeploy("check")}
            disabled={busy || healthLoading || !!deployingRow}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-emerald-400 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {healthLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Run health check
          </button>
        </div>

        {health && (
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  health.allOk
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {health.allOk ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {health.allOk ? "All checks passed" : "Problems found"}
              </span>
              <span className="text-xs text-ink-400">Checked {fmtTime(health.checkedAt)}</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {health.items.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-start justify-between gap-2 rounded-lg border p-3 ${
                    item.ok ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-800">
                      {item.ok ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-600" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">{item.note}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-ink-400">
                    {item.status === 0 ? "timeout" : `HTTP ${item.status}`} · {item.ms} ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- Deployment history ----------------------------------------------- */}
      <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <Clock className="h-4 w-4 text-ink-400" />
            Recent deploys &amp; checks
          </h2>
          <button
            onClick={fetchState}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-ink-500 transition hover:bg-ink-100 hover:text-ink-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {!state ? (
          <div className="mt-4 flex items-center justify-center gap-2 py-10 text-sm text-ink-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : state.deployments.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-ink-300 py-10 text-center text-sm text-ink-400">
            No deploys or checks yet — hit “Deploy now” or “Run health check” to see history here.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-ink-100">
            {state.deployments.map((d) => (
              <div key={d.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={d.status} />
                    <span className="text-sm font-semibold text-ink-800">
                      {d.action === "check"
                        ? "Health check"
                        : d.action === "dryrun"
                          ? `Dry run — ${ENV_LABELS[d.env] || "Default"}`
                          : ENV_LABELS[d.env] || "Default"}
                    </span>
                    <span className="text-xs text-ink-400">#{d.id}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ink-500">
                    {d.http_code && d.http_code !== "000" && (
                      <span
                        className={`font-mono font-semibold ${
                          d.http_code.startsWith("2") || d.http_code.startsWith("3")
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        HTTP {d.http_code}
                      </span>
                    )}
                    <span>{fmtDur(d.duration_ms)}</span>
                    <span>{fmtTime(d.started_at)}</span>
                    {d.log_tail && (
                      <button
                        onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-ink-200 px-2 py-1 font-semibold text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
                      >
                        {expanded === d.id ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        Log
                      </button>
                    )}
                  </div>
                </div>
                {expanded === d.id && d.log_tail && (
                  <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-ink-900 p-4 font-mono text-xs leading-relaxed text-ink-100">
                    {d.log_tail}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Footer note ------------------------------------------------------ */}
      <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-400">
        <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Deploys run fully detached: closing this page won&apos;t interrupt them. The
        database is backed up locally and on the server before every deploy, and the
        script verifies the live site before reporting success.
      </p>
    </div>
  );
}
