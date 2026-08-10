"use client";

import { useEffect, useState } from "react";
import { Users, Trash2, Heart, Inbox } from "lucide-react";

interface AccountRow {
  id: number;
  email: string;
  created_at: string;
  favorites: number;
}

export default function AccountsAdmin() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = () =>
    fetch("/api/admin/accounts")
      .then((r) => r.json())
      .then((data) => {
        setAccounts(Array.isArray(data) ? data : []);
        setLoading(false);
      });

  useEffect(() => {
    load();
  }, []);

  const remove = async (a: AccountRow) => {
    if (
      !confirm(
        `Delete the account "${a.email}"? Their favorites and session will be removed too.`
      )
    )
      return;
    await fetch(`/api/admin/accounts/${a.id}`, { method: "DELETE" });
    await load();
  };

  const visible = accounts.filter((a) => {
    if (!query) return true;
    return a.email.toLowerCase().includes(query.toLowerCase());
  });

  const totalFavorites = accounts.reduce((s, a) => s + a.favorites, 0);

  const formatDate = (iso: string) =>
    new Date(iso.replace(" ", "T") + "Z").toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Accounts</h1>
          <p className="mt-1 text-sm text-ink-500">
            Visitor accounts used to sync favorites across devices.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Total accounts
          </p>
          <p className="mt-1 text-2xl font-bold text-ink-900">{accounts.length}</p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Saved favorites
          </p>
          <p className="mt-1 text-2xl font-bold text-ink-900">{totalFavorites}</p>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Avg favorites / account
          </p>
          <p className="mt-1 text-2xl font-bold text-ink-900">
            {accounts.length ? (totalFavorites / accounts.length).toFixed(1) : "0"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email…"
          className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:max-w-xs"
        />
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="animate-pulse p-10 text-center text-sm text-ink-400">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink-300 py-14 text-center">
            <Inbox className="h-8 w-8 text-ink-300" />
            <p className="text-sm text-ink-400">
              {query
                ? "No accounts match your search."
                : "No visitor accounts yet. When visitors create an account to sync favorites, they'll show up here."}
            </p>
          </div>
        ) : (
          visible.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white p-4 shadow-card"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {a.email.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{a.email}</p>
                  <p className="text-xs text-ink-400">Joined {formatDate(a.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                  <Heart className="h-3.5 w-3.5" />
                  {a.favorites} favorite{a.favorites === 1 ? "" : "s"}
                </span>
                <button
                  onClick={() => remove(a)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-ink-200 bg-white p-4 text-sm text-ink-500">
        <Users className="h-4 w-4 shrink-0 text-brand-600" />
        Accounts are separate from admin logins. Deleting an account removes its
        favorites and signed-in session.
      </div>
    </div>
  );
}
