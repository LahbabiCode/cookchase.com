"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  ShieldCheck,
  CornerUpLeft,
  ThumbsUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { MAX_COMMENT_DEPTH } from "@/lib/constants";
import { useLang } from "@/lib/useLang";

interface CommentData {
  id: number;
  name: string;
  message: string;
  created_at: string;
  parent_id: number;
  is_admin: number;
  likes: number;
  replies?: CommentData[];
}

// localStorage key that records which comment IDs this browser has already
// liked — the anti double-vote guard. One entry per comment keeps the storage
// small and lets us toggle a like off by removing the ID.
const LIKED_KEY = "cookchase_liked_comments";

function loadLikedIds(): Set<number> {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((n) => typeof n === "number"));
  } catch {
    return new Set();
  }
}

function saveLikedIds(ids: Set<number>) {
  try {
    localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    /* storage full or blocked — like still works for this page load */
  }
}

const formatDate = (iso: string) =>
  new Date(iso.replace(" ", "T") + "Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

/** Inline reply form shown under a comment when the visitor hits "Reply". */
function ReplyForm({
  parent,
  pageType,
  pageSlug,
  onClose
}: {
  parent: CommentData;
  pageType: string;
  pageSlug: string;
  onClose: () => void;
}) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — hidden
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    // Honeypot: if a bot filled the hidden field, silently accept.
    if (website.trim()) {
      setStatus("success");
      setName("");
      setMessage("");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageType,
          pageSlug,
          name,
          email,
          message,
          website,
          parentId: parent.id
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || t("comments.errorGeneric"));
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMsg(t("comments.errorNetwork"));
    }
  };

  if (status === "success") {
    return (
      <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          {t("comments.replySubmitted")}
        </p>
        <p className="mt-1 text-sm text-green-700">
          {t("comments.replyWillAppear", { name: parent.name })}
        </p>
        <button
          onClick={onClose}
          className="mt-2 text-xs font-semibold text-brand-600 hover:underline"
        >
          {t("comments.done")}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
      <form onSubmit={submit}>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          {t("comments.replyTo", { name: parent.name })}
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`reply-name-${parent.id}`}>{t("comments.name")}</Label>
            <Input
              id={`reply-name-${parent.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("comments.yourName")}
              maxLength={60}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`reply-email-${parent.id}`}>{t("comments.email")}</Label>
            <Input
              id={`reply-email-${parent.id}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={120}
            />
          </div>
        </div>
        <p className="mt-1 text-[11px] text-ink-400">
          {t("comments.notified")}
        </p>
        <div className="mt-2 space-y-1">
          <Label htmlFor={`reply-message-${parent.id}`}>{t("comments.reply")}</Label>
          <Textarea
            id={`reply-message-${parent.id}`}
            className="min-h-20"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("comments.replyPlaceholder")}
            maxLength={2000}
            required
          />
        </div>
        {/* Honeypot — hidden from humans, bots can't resist filling it */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor={`reply-website-${parent.id}`}>Website</label>
          <input
            id={`reply-website-${parent.id}`}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
        {status === "error" && errorMsg && (
          <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <Button type="submit" size="sm" disabled={status === "loading"} className="h-9 px-4">
            <Send className="h-3.5 w-3.5" />
            {status === "loading" ? t("comments.posting") : t("comments.postReply")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t("comments.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function Comments({
  pageType,
  pageSlug
}: {
  pageType: string;
  pageSlug: string;
}) {
  const { t } = useLang();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — hidden
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [likedIds, setLikedIds] = useState<Set<number>>(() => loadLikedIds());
  // In-flight like requests per comment id (keeps rapid double-clicks safe).
  const [likeBusy, setLikeBusy] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch(`/api/comments?type=${pageType}&slug=${encodeURIComponent(pageSlug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setComments(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [pageType, pageSlug]);

  // Recursively bump the like count of one comment inside the tree.
  const patchCommentLikes = (
    list: CommentData[],
    id: number,
    delta: number
  ): CommentData[] =>
    list.map((c) =>
      c.id === id
        ? { ...c, likes: Math.max(0, c.likes + delta) }
        : { ...c, replies: c.replies ? patchCommentLikes(c.replies, id, delta) : c.replies }
    );

  // Recursively SET the like count to an absolute value (used to reconcile
  // with the server's authoritative count after a successful request).
  const setCommentLikes = (
    list: CommentData[],
    id: number,
    value: number
  ): CommentData[] =>
    list.map((c) =>
      c.id === id
        ? { ...c, likes: Math.max(0, value) }
        : { ...c, replies: c.replies ? setCommentLikes(c.replies, id, value) : c.replies }
    );

  const toggleLike = async (c: CommentData) => {
    if (likeBusy.has(c.id)) return; // ignore clicks while a request is in flight
    const wasLiked = likedIds.has(c.id);
    const action = wasLiked ? "unlike" : "like";

    // Optimistic UI: reflect the change immediately, then reconcile. The
    // liked-set is derived INSIDE a functional update (not from the closure)
    // so two likes on different comments clicked in the same render cycle
    // can never clobber each other's localStorage/state entries.
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(c.id);
      else next.add(c.id);
      saveLikedIds(next);
      return next;
    });
    setComments((prev) => patchCommentLikes(prev, c.id, wasLiked ? -1 : 1));
    setLikeBusy((prev) => new Set(prev).add(c.id));

    try {
      const res = await fetch(`/api/comments/${c.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Like failed");
      // Reconcile: replace the optimistic count with the server's authoritative
      // one. Setting the absolute value (not a delta) keeps the count exact even
      // when the optimistic value was clamped at 0 by patchCommentLikes.
      if (typeof data.likes === "number") {
        setComments((prev) => setCommentLikes(prev, c.id, data.likes));
      }
    } catch {
      // Revert the optimistic update on failure — toggle just this comment back
      // (never clobber likes the user cast on other comments while this flew).
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(c.id);
        else next.delete(c.id);
        saveLikedIds(next);
        return next;
      });
      setComments((prev) => patchCommentLikes(prev, c.id, wasLiked ? 1 : -1));
    } finally {
      setLikeBusy((prev) => {
        const next = new Set(prev);
        next.delete(c.id);
        return next;
      });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    // Honeypot: if a bot filled the hidden field, silently accept.
    if (website.trim()) {
      setStatus("success");
      setName("");
      setMessage("");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageType, pageSlug, name, email, message, website })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || t("comments.errorGeneric"));
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMsg(t("comments.errorNetwork"));
    }
  };

  const pageTypeLabel = (pageType: string) => {
    switch (pageType) {
      case "tool":
        return t("comments.typeTool");
      case "tool_category":
        return t("comments.typeCategory");
      case "article":
      case "blog":
        return t("comments.typeArticle");
      default:
        return t("comments.typePage");
    }
  };

  const renderComment = (c: CommentData, depth: number, parentName?: string) => {
    // Level 3 is the deepest a thread can go — no Reply button below it.
    const canReply = depth < MAX_COMMENT_DEPTH - 1;
    return (
      <div key={c.id}>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                c.is_admin ? "bg-ink-700" : "bg-brand-600"
              }`}
            >
              {c.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-900">
                {c.name}
                {c.is_admin === 1 && (
                  <span className="inline-flex items-center gap-1 rounded bg-ink-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    <ShieldCheck className="h-3 w-3" />
                    {t("comments.admin")}
                  </span>
                )}
              </p>
              <p className="text-xs text-ink-400">
                {formatDate(c.created_at)}
                {depth > 0 && parentName && (
                  <span className="text-ink-400">
                    {" "}· {t("comments.inReplyTo")}{" "}
                    <span className="font-medium text-ink-500">{parentName}</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
            {c.message}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => toggleLike(c)}
              disabled={likeBusy.has(c.id)}
              aria-pressed={likedIds.has(c.id)}
              title={likedIds.has(c.id) ? t("comments.removeLike") : t("comments.likeThis")}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
                likedIds.has(c.id)
                  ? "border-brand-300 bg-brand-50 text-brand-700 hover:border-brand-400"
                  : "border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:text-brand-600"
              }`}
            >
              <ThumbsUp
                className={`h-3.5 w-3.5 ${likedIds.has(c.id) ? "fill-brand-500 text-brand-500" : ""}`}
              />
              {c.likes > 0 ? c.likes : ""}
              <span>{c.likes === 1 ? t("comments.like") : t("comments.likes")}</span>
            </button>
            {canReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-brand-400 hover:text-brand-600"
              >
                <CornerUpLeft className="h-3.5 w-3.5" />
                {t("comments.reply")}
              </button>
            )}
          </div>
        </Card>

        {replyingTo === c.id && (
          <ReplyForm
            parent={c}
            pageType={pageType}
            pageSlug={pageSlug}
            onClose={() => setReplyingTo(null)}
          />
        )}

        {c.replies && c.replies.length > 0 && (
          <div
            className={`mt-3 space-y-3 border-l-2 pl-4 sm:pl-5 ${
              depth === 0
                ? "ml-5 border-brand-200 sm:ml-9"
                : depth === 1
                  ? "ml-4 border-ink-200 sm:ml-7"
                  : "ml-4 border-ink-200 sm:ml-6"
            }`}
          >
            {c.replies.map((r) => renderComment(r, depth + 1, c.name))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mt-14" aria-label="Comments">
      <h2 className="flex items-center gap-2 text-2xl font-bold text-ink-900">
        <MessageSquare className="h-5 w-5 text-brand-600" />
        {t("comments.title")}
        <span className="text-base font-normal text-ink-400">
          ({comments.length})
        </span>
      </h2>

      {comments.length > 0 ? (
        <div className="mt-6 space-y-4">
          {comments.map((c) => renderComment(c, 0))}
        </div>
      ) : (
        loaded && (
          <p className="mt-5 rounded-lg bg-ink-50 p-4 text-sm text-ink-500">
            {t("comments.beFirst", { type: pageTypeLabel(pageType) })}
          </p>
        )
      )}

      <div className="mt-8 rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6">
        {status === "success" ? (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-800">{t("comments.thanks")}</p>
                <p className="mt-0.5 text-sm text-green-700">
                  {t("comments.approval")}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatus("idle");
                setErrorMsg("");
              }}
              className="border-green-300 text-green-700 hover:bg-green-100 hover:text-green-700"
            >
              {t("comments.postAnother")}
            </Button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h3 className="text-base font-semibold text-ink-900">{t("comments.leave")}</h3>
            <p className="mt-1 text-sm text-ink-500">
              {t("comments.moderated")}
            </p>
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="comment-name">{t("comments.name")}</Label>
                  <Input
                    id="comment-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("comments.yourName")}
                    maxLength={60}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="comment-email">{t("comments.email")}</Label>
                  <Input
                    id="comment-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    maxLength={120}
                  />
                </div>
                {/* Honeypot — hidden from humans, bots can't resist filling it */}
                <div className="absolute -left-[9999px]" aria-hidden="true">
                  <label htmlFor="comment-website">Website</label>
                  <input
                    id="comment-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-[11px] text-ink-400">
                {t("comments.notified")}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="comment-message">{t("comments.comment")}</Label>
                <Textarea
                  id="comment-message"
                  className="min-h-24"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("comments.comment")}
                  maxLength={2000}
                  required
                />
              </div>
              {status === "error" && errorMsg && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMsg}
                </p>
              )}
              <Button type="submit" disabled={status === "loading"} className="h-10 px-5">
                <Send />
                {status === "loading" ? t("comments.posting") : t("comments.post")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
