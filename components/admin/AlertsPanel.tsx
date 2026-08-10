"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, Eye, MessageCircle, Check, Flame } from "lucide-react";

interface Alert {
  id: number;
  page_type: "tool" | "article";
  slug: string;
  display_name: string;
  metric: "views" | "comments";
  value: number;
  threshold: number;
  alert_date: string;
  status: "unread" | "read";
  created_at: string;
}

const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/alerts", { cache: "no-store" });
      const json = await res.json();
      setAlerts(Array.isArray(json.alerts) ? json.alerts : []);
      setUnread(json.unread || 0);
    } catch {
      /* panel is non-critical */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: number) => {
    await fetch("/api/admin/alerts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    load();
  };

  const markAll = async () => {
    await fetch("/api/admin/alerts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true })
    });
    load();
  };

  if (loading) {
    return <div className="animate-pulse rounded-xl border border-ink-200 bg-white p-5 shadow-card">Loading alerts…</div>;
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <BellRing className="h-4 w-4 text-amber-600" />
          Spike alerts
          {unread > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white">
              {unread} new
            </span>
          )}
        </h2>
        {alerts.length > 0 && unread > 0 && (
          <button
            onClick={markAll}
            className="inline-flex items-center gap-1 rounded-md border border-ink-200 px-2.5 py-1.5 text-xs font-medium text-ink-600 transition hover:border-amber-300 hover:text-amber-700"
          >
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-500">
          <Flame className="h-4 w-4 text-ink-300" />
          No tool or article has crossed a daily views or comments threshold
          yet. Configure thresholds in Settings → Spike alerts.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-ink-100">
          {alerts.map((a) => (
            <li
              key={a.id}
              className={`flex items-center gap-3 py-2.5 ${
                a.status === "unread" ? "" : "opacity-60"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  a.metric === "views"
                    ? "bg-brand-50 text-brand-600"
                    : "bg-pink-50 text-pink-600"
                }`}
              >
                {a.metric === "views" ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">
                  <span className="mr-1.5 inline-flex items-center gap-1 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                    {a.page_type === "article" ? "Article" : "Tool"}
                  </span>
                  <Link
                    href={a.page_type === "article" ? `/blog/${a.slug}` : `/tools/${a.slug}`}
                    target="_blank"
                    className="transition hover:text-brand-600"
                  >
                    {a.display_name || a.slug.replace(/-/g, " ")}
                  </Link>
                  {a.status === "unread" && (
                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" />
                  )}
                </p>
                <p className="text-xs text-ink-500">
                  {a.metric === "views" ? "Views today" : "Comments today"}:{" "}
                  <span className="font-semibold text-ink-900">
                    {a.value.toLocaleString()}
                  </span>{" "}
                  · threshold {a.threshold.toLocaleString()} · {fmtDate(a.alert_date)}
                </p>
              </div>
              {a.status === "unread" && (
                <button
                  onClick={() => markRead(a.id)}
                  className="shrink-0 rounded-md border border-ink-200 px-2.5 py-1.5 text-xs font-medium text-ink-600 transition hover:border-brand-300 hover:text-brand-600"
                  aria-label={`Mark ${a.display_name} alert as read`}
                >
                  Dismiss
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
