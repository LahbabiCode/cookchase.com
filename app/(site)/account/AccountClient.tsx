"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ArrowRight,
  ShieldCheck,
  Lock,
  LogOut,
  KeyRound,
  Smartphone,
  Tablet,
  Laptop,
  Trash2,
  AlertTriangle,
  History,
  RefreshCw,
  Check,
  SlidersHorizontal
} from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";
import { useLang } from "@/lib/useLang";
import type { Tool } from "@/lib/queries";
import ToolCard from "@/components/ToolCard";

const inputCls =
  "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

const btnPrimary =
  "inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60";

// ---- Sessions (devices) ------------------------------------------------------

interface SessionRow {
  sessionId: string;
  current: boolean;
  deviceLabel: string;
  deviceKind: "mobile" | "tablet" | "desktop";
  ip: string;
  createdAt: string;
  lastSeen: string;
  expiresAt: string;
}

const DEVICE_ICONS: Record<SessionRow["deviceKind"], typeof Laptop> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Laptop
};

function formatWhen(iso: string, fallback = "—"): string {
  if (!iso) return fallback;
  const d = new Date(iso.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function DevicesSection() {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/account/sessions");
      if (!res.ok) {
        setSessions([]);
        return;
      }
      const data = await res.json();
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch {
      setSessions([]);
      setError("Could not load your devices. Try refreshing the page.");
    }
  }, []);

  useEffect(() => {
    load();
    // The password section revokes every other session server-side; reload so
    // the list stops showing devices the server already signed out.
    const onSessionsChanged = () => load();
    window.addEventListener("cookchase:sessions-changed", onSessionsChanged);
    return () => {
      window.removeEventListener("cookchase:sessions-changed", onSessionsChanged);
    };
  }, [load]);

  const revoke = async (sessionId: string) => {
    setBusy(sessionId);
    setError("");
    try {
      const res = await fetch(`/api/account/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Could not revoke that session.");
      }
      setSessions((prev) => (prev || []).filter((s) => s.sessionId !== sessionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not revoke that session.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink-900">Signed-in devices</h2>
          <p className="mt-0.5 text-sm text-ink-500">
            Every device signed in to your account. Revoke any session remotely — the device
            is signed out instantly.
          </p>
        </div>
      </div>

      {sessions === null ? (
        <div className="mt-4 animate-pulse rounded-lg bg-ink-100 p-6 text-center text-sm text-ink-400">
          Loading your devices…
        </div>
      ) : sessions.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">
          No active sessions found.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {sessions.map((s) => {
            const Icon = DEVICE_ICONS[s.deviceKind] || Laptop;
            return (
              <div
                key={s.sessionId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-100 bg-ink-50/50 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-ink-500 ring-1 ring-ink-100">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-900">
                      <span className="truncate">{s.deviceLabel}</span>
                      {s.current && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                          This device
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {s.ip ? `${s.ip} · ` : ""}last active {formatWhen(s.lastSeen)} · signed in{" "}
                      {formatWhen(s.createdAt)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-300">
                      session expires {formatWhen(s.expiresAt)}
                    </p>
                  </div>
                </div>
                {!s.current && (
                  <button
                    onClick={() => revoke(s.sessionId)}
                    disabled={busy === s.sessionId}
                    className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    {busy === s.sessionId ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LogOut className="h-3.5 w-3.5" />
                    )}
                    Sign out
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {error && (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

// ---- Password ----------------------------------------------------------------

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDone(false);
    if (next !== confirm) {
      setError("New password and confirmation don't match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change the password.");
      setCurrent("");
      setNext("");
      setConfirm("");
      setDone(true);
      // Other devices were signed out by this change — tell the devices list
      // to refresh so it reflects what the server actually revoked.
      window.dispatchEvent(new Event("cookchase:sessions-changed"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change the password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
          <KeyRound className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink-900">Change password</h2>
          <p className="mt-0.5 text-sm text-ink-500">
            Your new password needs at least 8 characters. Changing it signs out every other
            device for your safety.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="acct-current" className="mb-1.5 block text-sm font-medium text-ink-700">
            Current password
          </label>
          <input
            id="acct-current"
            type="password"
            required
            className={inputCls}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="acct-next" className="mb-1.5 block text-sm font-medium text-ink-700">
              New password
            </label>
            <input
              id="acct-next"
              type="password"
              required
              minLength={8}
              className={inputCls}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="acct-confirm" className="mb-1.5 block text-sm font-medium text-ink-700">
              Confirm new password
            </label>
            <input
              id="acct-confirm"
              type="password"
              required
              minLength={8}
              className={inputCls}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {done && (
          <p className="flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
            <Check className="h-4 w-4" />
            Password changed successfully.
          </p>
        )}

        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

// ---- Delete account ----------------------------------------------------------

function DeleteSection({ onDeleted }: { onDeleted: () => void }) {
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const confirmed = confirmText.toLowerCase() === "delete";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete the account.");
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the account.");
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink-900">Delete account</h2>
          <p className="mt-0.5 text-sm text-ink-600">
            This permanently deletes your account, synced favorites, saved results and all
            sessions. This cannot be undone.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label htmlFor="acct-del-password" className="mb-1.5 block text-sm font-medium text-ink-700">
            Your password
          </label>
          <input
            id="acct-del-password"
            type="password"
            required
            className={inputCls}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div>
          <label htmlFor="acct-del-confirm" className="mb-1.5 block text-sm font-medium text-ink-700">
            Type <span className="font-mono font-bold text-red-600">delete</span> to confirm
          </label>
          <input
            id="acct-del-confirm"
            type="text"
            required
            className={inputCls}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete"
          />
        </div>
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !confirmed}
          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {busy ? "Deleting…" : "Delete my account"}
        </button>
      </form>
    </div>
  );
}

// ---- Preferences (synced settings) --------------------------------------------

function PreferencesSection() {
  // settings.easyMode is the single source of truth — updateSettings is the
  // only writer and it keeps the DOM class + header toggle in sync via
  // applyEasyModeFromAccount, so reading the store here never drifts.
  const { settings, updateSettings } = useFavorites();
  const easyEnabled = settings.easyMode;
  const contrastEnabled = easyEnabled && settings.easyContrast;

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
          <SlidersHorizontal className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink-900">Preferences</h2>
          <p className="mt-0.5 text-sm text-ink-500">
            Your choices follow you on every device when you&apos;re signed in — the
            tools and the site use them automatically.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {/* Measurement units */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink-800">Measurement units</p>
            <p className="text-xs text-ink-500">
              Metric (grams, °C) or imperial (ounces, °F) for tool results.
            </p>
          </div>
          <div className="grid grid-cols-2 overflow-hidden rounded-md border border-ink-200 text-sm font-medium">
            {(["metric", "imperial"] as const).map((u) => (
              <button
                key={u}
                onClick={() => updateSettings({ units: u })}
                className={`px-3 py-2 capitalize transition ${
                  settings.units === u
                    ? "bg-brand-600 text-white"
                    : "bg-white text-ink-600 hover:bg-ink-50"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>



        {/* Easy mode */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink-800">Easy mode</p>
            <p className="text-xs text-ink-500">
              Bigger text, higher contrast and read-aloud help.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={easyEnabled}
            aria-label="Toggle easy mode"
            onClick={() =>
              updateSettings({
                easyMode: !settings.easyMode,
                // Turning Easy off also clears the dark contrast sub-option —
                // it only makes sense while Easy Mode is on.
                easyContrast: !settings.easyMode ? false : settings.easyContrast
              })
            }
            className={`relative h-7 w-12 rounded-full transition ${
              easyEnabled ? "bg-brand-600" : "bg-ink-200"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                easyEnabled ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Dark high contrast — a sub-option of Easy Mode, shown only while
            Easy is on. Last resort for severe low vision: black background,
            white text, clearly outlined cards. */}
        {easyEnabled && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink-800">Dark high contrast</p>
              <p className="text-xs text-ink-500">
                Black background, bright white text and clearly outlined cards —
                for very low vision.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={contrastEnabled}
              aria-label="Toggle dark high contrast"
              onClick={() => updateSettings({ easyContrast: !settings.easyContrast })}
              className={`relative h-7 w-12 rounded-full transition ${
                contrastEnabled ? "bg-ink-900" : "bg-ink-200"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                  contrastEnabled ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Page --------------------------------------------------------------------

function GuestView() {
  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <Lock className="h-7 w-7" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-ink-900">Sign in to manage your account</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">
        Sign in to see your synced favorites, change your password, manage your devices and more.
      </p>
      <Link
        href="/favorites"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        Sign in / create account
        <ArrowRight className="h-4 w-4" />
      </Link>
      <Link
        href="/forgot-password"
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700"
      >
        Forgot password?
      </Link>
    </div>
  );
}

export default function AccountClient({
  tools,
  commentCounts,
  viewsCounts
}: {
  tools: Tool[];
  commentCounts: Record<string, number>;
  viewsCounts: Record<string, number>;
}) {
  const { ready, auth, email, createdAt, favorites, clear, signOut } = useFavorites();
  const { lang } = useLang();
  const router = useRouter();
  const favTools = tools.filter((t) => favorites.includes(t.slug));

  if (!ready) {
    return (
      <div className="mx-auto mt-10 max-w-md animate-pulse rounded-lg bg-ink-100 p-10 text-center text-sm text-ink-400">
        Loading your account…
      </div>
    );
  }

  if (auth !== "signedIn") {
    return <GuestView />;
  }

  const handleDeleted = async () => {
    await signOut(); // clears the client store + dispatches history reset
    router.push("/");
  };

  const initial = (email || "A").charAt(0).toUpperCase();
  const memberSince = createdAt ? new Date(createdAt.replace(" ", "T") + "Z") : null;
  const memberSinceLabel = memberSince && !isNaN(memberSince.getTime())
    ? memberSince.toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "";

  return (
    <div className="mt-10 space-y-8">
      {/* Profile summary */}
      <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-xl font-bold text-white">
              {initial}
            </span>
            <div>
              <p className="text-lg font-semibold text-ink-900">{email}</p>
              <p className="text-sm text-ink-500">
                Free member — all tools included
                {memberSinceLabel ? ` · member since ${memberSinceLabel}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-red-200 hover:text-red-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Synced favorites */}
      <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <Heart className="h-4 w-4 text-red-500" />
            Synced favorites
          </h2>
          <Link
            href="/favorites"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Open favorites page
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {favTools.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">
            No favorites yet — tap the heart on any tool to save it here.
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm text-ink-500">
              {favTools.length} saved tool{favTools.length === 1 ? "" : "s"} · synced to every
              device
            </p>
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
            <button
              onClick={clear}
              className="mt-4 text-xs font-medium text-red-500 underline underline-offset-2 hover:text-red-600"
            >
              Clear all favorites
            </button>
          </>
        )}
      </div>

      {/* Saved results history teaser */}
      <Link
        href="/favorites"
        className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-5 shadow-card transition hover:border-brand-300"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
          <History className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink-900">Saved results</p>
          <p className="text-xs text-ink-500">
            View the calculations you saved from the tools — free for every account.
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-ink-400" />
      </Link>

      <PreferencesSection />

      <DevicesSection />

      <PasswordSection />

      <DeleteSection onDeleted={handleDeleted} />
    </div>
  );
}
