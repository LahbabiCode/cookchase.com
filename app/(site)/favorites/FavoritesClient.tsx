"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  ArrowRight,
  Mail,
  Lock,
  LogOut,
  RefreshCw,
  History,
  Trash2,
  ExternalLink
} from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";
import { useResultHistory } from "@/lib/useResultHistory";
import { useLang } from "@/lib/useLang";
import type { Tool } from "@/lib/queries";
import ToolCard from "@/components/ToolCard";

const inputCls =
  "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

function AuthPanel() {
  const { signIn, signUp } = useFavorites();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      // On success the shared store flips to signedIn, so this panel unmounts
      // and SignedInPanel takes over automatically.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="fav-email" className="mb-1.5 block text-sm font-medium text-ink-700">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
            <input
              id="fav-email"
              type="email"
              required
              className={`${inputCls} pl-9`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="fav-password" className="block text-sm font-medium text-ink-700">
              Password
            </label>
            {mode === "login" && (
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
            <input
              id="fav-password"
              type="password"
              required
              minLength={mode === "register" ? 8 : 1}
              className={`${inputCls} pl-9`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {busy
            ? "Please wait…"
            : mode === "register"
              ? "Create account"
              : "Sign in"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
          className="text-sm font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700"
        >
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </form>
  );
}

function SignedInPanel({ email }: { email: string }) {
  const { signOut } = useFavorites();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-sm text-ink-600">
        <RefreshCw className="h-4 w-4 text-brand-600" />
        Synced as <span className="font-semibold text-ink-900">{email}</span> — your favorites
        follow you on any device.
      </p>
      <button
        onClick={() => signOut()}
        className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:border-red-200 hover:text-red-600"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </div>
  );
}

function ResultHistorySection() {
  const { results, ready, removeResult, clearResults } = useResultHistory();

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
          <History className="h-4 w-4 text-brand-600" />
          Saved results
        </h2>
        {results.length > 0 && (
          <button
            onClick={clearResults}
            className="text-xs font-medium text-red-500 underline underline-offset-2 hover:text-red-600"
          >
            Clear all
          </button>
        )}
      </div>

      {!ready ? (
        <div className="mt-3 animate-pulse rounded-lg bg-ink-100 p-8 text-center text-sm text-ink-400">
          Loading your saved results…
        </div>
      ) : results.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-400">
            <History className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-semibold text-ink-900">No saved results yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-500">
            Open any tool, calculate a result, then press &quot;Save result&quot; — it will show up
            here, ready to revisit.
          </p>
          <Link
            href="/tools"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Browse tools
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {results.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white p-4 shadow-card"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">{r.title}</p>
                <p className="mt-0.5 text-xs text-ink-400">
                  {r.tool_name} ·{" "}
                  {new Date(r.created_at + "Z").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}
                </p>
                {r.rows.length > 0 && (
                  <p className="mt-1.5 truncate text-xs text-ink-500">
                    {r.rows.slice(0, 3).map((row) => `${row.label}: ${row.value}`).join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.tool_slug && (
                  <Link
                    href={`/tools/${r.tool_slug}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open tool
                  </Link>
                )}
                <button
                  onClick={() => removeResult(r.id)}
                  aria-label={`Delete saved result: ${r.title}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FavoritesClient({
  tools,
  commentCounts,
  viewsCounts
}: {
  tools: Tool[];
  commentCounts: Record<string, number>;
  viewsCounts: Record<string, number>;
}) {
  const { favorites, ready, auth, email, clear } = useFavorites();
  const { lang } = useLang();
  const favTools = tools.filter((t) => favorites.includes(t.slug));

  return (
    <div className="mt-10">
      {!ready ? (
        <div className="animate-pulse rounded-lg bg-ink-100 p-10 text-center text-sm text-ink-400">
          Loading your favorites…
        </div>
      ) : (
        <>
          {/* Account / sync panel */}
          <div className="mx-auto max-w-2xl rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6">
            {auth === "guest" ? (
              <>
                <h2 className="text-base font-semibold text-ink-900">
                  Sign in to sync your favorites
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">
                  Create a free account to keep your saved tools in sync across
                  your phone, tablet and computer. Favorites you saved on this
                  device will be merged into your account automatically.
                </p>
                <div className="mt-4">
                  <AuthPanel />
                </div>
              </>
            ) : (
              <SignedInPanel email={email} />
            )}
          </div>

          {/* Saved results history — free for every signed-in account. */}
          {auth === "signedIn" && (
            <ResultHistorySection />
          )}

          {/* Favorites grid */}
          <div className="mt-8">
            {favTools.length === 0 ? (
              <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-400">
                  <Heart className="h-7 w-7" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-ink-900">
                  No favorites yet
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  Browse the tools and tap the heart on any tool you use often — it will
                  show up here instantly{auth === "signedIn" ? ", ready to sync" : ""}.
                </p>
                <Link
                  href="/tools"
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Browse all tools
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink-500">
                    {favTools.length} saved tool{favTools.length === 1 ? "" : "s"}
                  </p>
                  <button
                    onClick={clear}
                    className="text-xs font-medium text-red-500 underline underline-offset-2 hover:text-red-600"
                  >
                    Clear all
                  </button>
                </div>
                <div className="cv-auto mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {favTools.map((tool) => (
                    <ToolCard
                      key={tool.slug}
                      tool={tool}
                      commentCount={commentCounts[tool.slug] ?? 0}
                      views={viewsCounts[tool.slug] ?? 0}
                      lang={lang}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
