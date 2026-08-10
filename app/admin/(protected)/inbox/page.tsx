"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Inbox,
  Mail,
  MailOpen,
  Trash2,
  RefreshCw,
  ExternalLink,
  MailQuestion
} from "lucide-react";

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: number;
  created_at: string;
}

const formatDate = (iso: string) =>
  new Date(iso.replace(" ", "T") + "Z").toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

export default function AdminInbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inbox", { cache: "no-store" });
      if (res.ok) setMessages(await res.json());
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleRead = async (m: Message) => {
    await fetch("/api/admin/inbox", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id, read: m.read ? 0 : 1 })
    });
    setMessages((ms) =>
      ms.map((x) => (x.id === m.id ? { ...x, read: x.read ? 0 : 1 } : x))
    );
  };

  const remove = async (id: number) => {
    await fetch(`/api/admin/inbox?id=${id}`, { method: "DELETE" });
    setMessages((ms) => ms.filter((x) => x.id !== id));
  };

  const unread = messages.filter((m) => m.read === 0).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink-900">
            <Inbox className="h-6 w-6 text-brand-600" />
            Contact Inbox
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            Messages sent through the /contact form. You&apos;re also emailed about
            each one when the &quot;Contact messages&quot; notification is enabled in Settings.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-ink-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink-900">
            {messages.length} message{messages.length === 1 ? "" : "s"}
            {unread > 0 && (
              <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                {unread} unread
              </span>
            )}
          </p>
          <a
            href={`mailto:${messages[0]?.email || ""}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Reply from your mail app
          </a>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse p-10 text-center text-sm text-ink-400">Loading…</div>
      ) : messages.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <MailQuestion className="mx-auto h-10 w-10 text-ink-300" />
          <p className="mt-3 text-sm font-medium text-ink-600">No messages yet</p>
          <p className="mt-1 text-xs text-ink-400">
            Messages from the /contact form will appear here.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-xl border bg-white p-4 shadow-card transition ${
                m.read === 0 ? "border-brand-200 bg-brand-50/30" : "border-ink-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      m.read === 0 ? "bg-brand-100 text-brand-700" : "bg-ink-100 text-ink-500"
                    }`}
                  >
                    {m.read === 0 ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">
                      {m.subject || "Message from contact form"}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {m.name} · <span className="text-brand-600">{m.email}</span> ·{" "}
                      {formatDate(m.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => toggleRead(m)}
                    title={m.read ? "Mark as unread" : "Mark as read"}
                    className="rounded-md border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-brand-400 hover:text-brand-600"
                  >
                    {m.read ? "Unread" : "Read"}
                  </button>
                  <button
                    onClick={() => remove(m.id)}
                    title="Delete"
                    className="rounded-md border border-ink-200 px-2.5 py-1.5 text-xs font-semibold text-ink-500 transition hover:border-red-300 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                className="mt-3 text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                {expanded === m.id ? "Hide message" : "Show message"}
              </button>
              {expanded === m.id && (
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-ink-50 px-4 py-3 text-sm leading-relaxed text-ink-700">
                  {m.message}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
