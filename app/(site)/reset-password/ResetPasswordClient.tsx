"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock, KeyRound, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";

const inputCls =
  "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/account/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reset your password.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your password.");
    } finally {
      setBusy(false);
    }
  };

  // No token in the URL — tell the visitor how to get a fresh link.
  if (!token) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-ink-900">Missing reset link</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          This page needs the link from your reset email. Open the email we sent you and tap
          the button inside it — or request a new link below.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-ink-900">Password updated</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Your new password is saved and every device has been signed out. You can now sign
          in with your new password.
        </p>
        <Link
          href="/favorites"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <Lock className="h-4 w-4" />
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">
        <KeyRound className="h-3.5 w-3.5 shrink-0 text-brand-600" />
        <span className="truncate">Link valid for this session — single use only.</span>
      </div>

      <div>
        <label htmlFor="reset-password" className="mb-1.5 block text-sm font-medium text-ink-700">
          New password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            id="reset-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={`${inputCls} pl-9`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
      </div>

      <div>
        <label htmlFor="reset-confirm" className="mb-1.5 block text-sm font-medium text-ink-700">
          Confirm new password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            id="reset-confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={`${inputCls} pl-9`}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your new password"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save new password"}
      </button>

      <p className="text-center text-sm text-ink-500">
        <Link href="/forgot-password" className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-3.5 w-3.5" />
          Request a new link
        </Link>
      </p>
    </form>
  );
}
