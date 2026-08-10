"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Trash2,
  MessageSquare,
  Inbox,
  Reply as ReplyIcon,
  Send,
  ShieldCheck,
  CornerUpLeft,
  ThumbsUp
} from "lucide-react";
import { MAX_COMMENT_DEPTH } from "@/lib/constants";

interface Comment {
  id: number;
  page_type: string;
  page_slug: string;
  name: string;
  email?: string;
  message: string;
  approved: number;
  parent_id: number;
  is_admin: number;
  likes: number;
  created_at: string;
}

const inputCls =
  "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export default function CommentsAdmin() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [query, setQuery] = useState("");
  const [replyFor, setReplyFor] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyMsg, setReplyMsg] = useState<{ id: number; ok: boolean; text: string } | null>(null);

  const load = () =>
    fetch("/api/admin/comments")
      .then((r) => r.json())
      .then((data) => {
        setComments(Array.isArray(data) ? data : []);
        setLoading(false);
      });

  useEffect(() => {
    load();
  }, []);

  const approve = async (c: Comment) => {
    await fetch(`/api/admin/comments/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: true })
    });
    await load();
  };

  const remove = async (c: Comment) => {
    if (!confirm(`Delete comment by "${c.name}" (and any replies below it)?`)) return;
    await fetch(`/api/admin/comments/${c.id}`, { method: "DELETE" });
    await load();
  };

  const reply = async (c: Comment) => {
    if (replyText.trim().length < 2) return;
    setReplyBusy(true);
    setReplyMsg(null);
    const res = await fetch(`/api/admin/comments/${c.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: replyText })
    });
    const json = await res.json();
    if (res.ok) {
      setReplyMsg({ id: c.id, ok: true, text: "Reply published ✓" });
      setReplyText("");
      setReplyFor(null);
      await load();
    } else {
      setReplyMsg({ id: c.id, ok: false, text: json.error || "Failed to reply" });
    }
    setReplyBusy(false);
  };

  // --- Tree helpers ---------------------------------------------------------
  const byId = useMemo(() => {
    const m = new Map<number, Comment>();
    for (const c of comments) m.set(c.id, c);
    return m;
  }, [comments]);

  // Replies hanging off a comment, oldest first so the thread reads top-down.
  // id breaks ties when two replies share the same second (SQLite precision).
  const repliesOf = (id: number) =>
    comments
      .filter((c) => c.parent_id === id)
      .sort(
        (a, b) =>
          a.created_at.localeCompare(b.created_at) || a.id - b.id
      );

  // Ancestor chain (closest first) for a "in reply to" context line.
  const ancestorsOf = (c: Comment): Comment[] => {
    const chain: Comment[] = [];
    const seen = new Set<number>();
    let cur: Comment | undefined = c.parent_id ? byId.get(c.parent_id) : undefined;
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      chain.unshift(cur);
      cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
    }
    return chain;
  };

  // --- Tabs -----------------------------------------------------------------
  // Pending queue: EVERYTHING awaiting approval, at any depth.
  const pending = comments.filter((c) => c.approved === 0);
  // Approved tab: top-level approved comments with their full reply subtrees.
  const approvedTop = comments.filter((c) => c.approved === 1 && c.parent_id === 0);

  const matches = (c: Comment) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const parentNames = ancestorsOf(c).map((p) => p.name).join(" ");
    return (
      c.name.toLowerCase().includes(q) ||
      c.message.toLowerCase().includes(q) ||
      c.page_slug.toLowerCase().includes(q) ||
      parentNames.toLowerCase().includes(q)
    );
  };

  const visiblePending = pending.filter(matches);
  const visibleApproved = approvedTop.filter(matches);

  // --- Formatting / links ---------------------------------------------------
  const formatDate = (iso: string) =>
    new Date(iso.replace(" ", "T") + "Z").toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  const pageHref = (c: Comment) => {
    if (c.page_type === "article") return `/blog/${c.page_slug}`;
    if (c.page_type === "page") {
      if (c.page_slug === "home") return "/";
      if (c.page_slug === "tools") return "/tools";
      return `/${c.page_slug}`;
    }
    return `/tools/${c.page_slug}`;
  };
  const pageLabel = (c: Comment) =>
    c.page_type === "article" ? "article" : c.page_type === "page" ? "page" : "tool";

  // --- Shared pieces ----------------------------------------------------------
  const actions = (c: Comment, canReply = true) => (
    <div className="flex items-center gap-2">
      {canReply && (
        <button
          onClick={() => {
            setReplyFor(replyFor === c.id ? null : c.id);
            setReplyMsg(null);
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-brand-400 hover:text-brand-600"
        >
          <ReplyIcon className="h-3.5 w-3.5" />
          Reply
        </button>
      )}
      {c.approved === 0 && (
        <button
          onClick={() => approve(c)}
          className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
        >
          <Check className="h-3.5 w-3.5" />
          Approve
        </button>
      )}
      <button
        onClick={() => remove(c)}
        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  );

  const replyBox = (c: Comment) =>
    replyFor === c.id && (
      <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50/40 p-3">
        <p className="text-xs font-semibold text-ink-700">
          Reply to {c.name}
          {c.email ? ` · <${c.email}>` : ""}
        </p>
        <textarea
          className={`${inputCls} mt-2 min-h-20`}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Write your reply — it goes live immediately…"
          maxLength={2000}
        />
        {replyMsg && replyMsg.id === c.id && (
          <p className={`mt-1.5 text-sm ${replyMsg.ok ? "text-green-600" : "text-red-600"}`}>
            {replyMsg.text}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => reply(c)}
            disabled={replyBusy || replyText.trim().length < 2}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {replyBusy ? "Posting…" : "Post reply"}
          </button>
          <button
            onClick={() => {
              setReplyFor(null);
              setReplyText("");
              setReplyMsg(null);
            }}
            className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-ink-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );

  // A single comment card (used for pending items and the top of approved cards).
  const commentCard = (c: Comment, extra?: React.ReactNode) => (
    <div
      key={c.id}
      className={`rounded-xl border p-4 shadow-card ${
        c.approved === 1 ? "border-ink-200 bg-white" : "border-amber-200 bg-amber-50/40"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {c.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-900">
              {c.name}
              {c.is_admin === 1 && (
                <span className="inline-flex items-center gap-1 rounded bg-ink-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  <ShieldCheck className="h-3 w-3" />
                  Admin
                </span>
              )}
              {c.approved === 0 && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  Awaiting approval
                </span>
              )}
            </p>
            <p className="text-xs text-ink-400">
              {formatDate(c.created_at)} ·{" "}
              <Link
                href={pageHref(c)}
                target="_blank"
                className="text-brand-600 underline underline-offset-2 hover:text-brand-700"
              >
                {pageLabel(c)}/{c.page_slug}
              </Link>
              {c.email ? ` · ${c.email}` : ""}
            </p>
            {c.likes > 0 && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600">
                <ThumbsUp className="h-3.5 w-3.5 fill-brand-100" />
                {c.likes} like{c.likes === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>
        {actions(c)}
      </div>
      <p className="mt-3 whitespace-pre-wrap rounded-lg bg-ink-50 p-3 text-sm leading-relaxed text-ink-700">
        {c.message}
      </p>
      {replyBox(c)}
      {extra}
    </div>
  );

  // Nested replies under an approved card (capped at 3 levels, like the frontend).
  const renderReply = (c: Comment, depth: number): React.ReactNode => {
    const children = repliesOf(c.id);
    return (
      <div key={c.id}>
        <div
          className={`rounded-lg border p-3 ${
            c.approved === 1
              ? "border-ink-100 bg-ink-50/60"
              : "border-amber-200 bg-amber-50/60"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100">
              {c.is_admin === 1 ? (
                <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
              ) : (
                <CornerUpLeft className="h-3 w-3 text-brand-600" />
              )}
            </span>
            <span className="text-xs font-semibold text-ink-900">{c.name}</span>
            {c.is_admin === 1 && (
              <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                Admin
              </span>
            )}
            {c.approved === 0 && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Awaiting approval
              </span>
            )}
            <span className="text-xs text-ink-400">{formatDate(c.created_at)}</span>
            {c.likes > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700">
                <ThumbsUp className="h-3 w-3" />
                {c.likes}
              </span>
            )}
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
            {c.message}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {actions(c, depth < MAX_COMMENT_DEPTH - 1)}
          </div>
          {replyBox(c)}
        </div>
        {children.length > 0 && depth < MAX_COMMENT_DEPTH && (
          <div className="ml-4 mt-2 space-y-2 border-l-2 border-ink-200 pl-3">
            {children.map((r) => renderReply(r, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Comments</h1>
          <p className="mt-1 text-sm text-ink-500">
            Moderate visitor comments and replies before they go live.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-1 rounded-md border border-ink-200 bg-white p-1">
          <button
            onClick={() => setTab("pending")}
            className={`rounded px-4 py-1.5 text-sm font-medium transition ${
              tab === "pending" ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-50"
            }`}
          >
            Pending ({pending.length})
          </button>
          <button
            onClick={() => setTab("approved")}
            className={`rounded px-4 py-1.5 text-sm font-medium transition ${
              tab === "approved" ? "bg-brand-600 text-white" : "text-ink-600 hover:bg-ink-50"
            }`}
          >
            Approved ({approvedTop.length})
          </button>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search comments…"
          className={`${inputCls} sm:max-w-xs`}
        />
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="animate-pulse p-10 text-center text-sm text-ink-400">Loading…</div>
        ) : tab === "pending" ? (
          visiblePending.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink-300 py-14 text-center">
              <Inbox className="h-8 w-8 text-ink-300" />
              <p className="text-sm text-ink-400">
                No pending comments or replies. Nice and quiet.
              </p>
            </div>
          ) : (
            visiblePending.map((c) => {
              const chain = ancestorsOf(c);
              return commentCard(
                c,
                chain.length > 0 && (
                  <div className="mt-3 rounded-lg border border-ink-100 bg-white p-3">
                    <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                      <CornerUpLeft className="h-3 w-3" />
                      In reply to
                    </p>
                    <div className="mt-1.5 space-y-1.5">
                      {chain.map((p) => (
                        <div key={p.id} className="flex items-start gap-2 text-xs">
                          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                          <p className="text-ink-600">
                            <span className="font-semibold text-ink-800">{p.name}</span>
                            <span className="text-ink-400">
                              {" "}
                              · {p.message.slice(0, 120)}
                              {p.message.length > 120 ? "…" : ""}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              );
            })
          )
        ) : visibleApproved.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink-300 py-14 text-center">
            <Inbox className="h-8 w-8 text-ink-300" />
            <p className="text-sm text-ink-400">No approved comments yet.</p>
          </div>
        ) : (
          visibleApproved.map((c) =>
            commentCard(c, repliesOf(c.id).length > 0 && (
              <div className="mt-3 space-y-2 border-l-2 border-brand-200 pl-4">
                {repliesOf(c.id).map((r) => renderReply(r, 1))}
              </div>
            ))
          )
        )}
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-ink-200 bg-white p-4 text-sm text-ink-500">
        <MessageSquare className="h-4 w-4 shrink-0 text-brand-600" />
        Visitors can reply to comments up to 3 levels deep. Replies stay hidden until
        approved, and the comment&apos;s author is emailed once their reply goes live. Admin
        replies publish immediately and show up indented under the comment.
      </div>
    </div>
  );
}
