"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

// Result history for signed-in accounts — free for everyone. Same
// module-level shared-store pattern as useFavorites: any component that
// saves/removes updates every consumer on the page instantly. Reloads
// automatically when the auth bus ("cookchase:auth" — dispatched by
// useFavorites on sign-in/out) fires.

export interface SavedResultRow {
  label: string;
  value: string;
  sub?: string;
}

export interface SavedResult {
  id: number;
  tool_slug: string;
  tool_name: string;
  title: string;
  rows: SavedResultRow[];
  created_at: string;
}

export interface HistorySnapshot {
  results: SavedResult[];
  ready: boolean;
}

let store: HistorySnapshot = { results: [], ready: false };

const listeners = new Set<() => void>();
let loadPromise: Promise<void> | null = null;

function setStore(patch: Partial<HistorySnapshot>) {
  store = { ...store, ...patch };
  for (const fn of Array.from(listeners)) fn();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): HistorySnapshot {
  return store;
}

const serverSnapshot: HistorySnapshot = { results: [], ready: false };

function getServerSnapshot(): HistorySnapshot {
  return serverSnapshot;
}

async function load() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const res = await fetch("/api/account/history");
      if (!res.ok) {
        setStore({ results: [], ready: true });
        return;
      }
      const data = await res.json();
      setStore({ results: Array.isArray(data.results) ? data.results : [], ready: true });
    } catch {
      setStore({ results: [], ready: true });
    }
  })().finally(() => {
    loadPromise = null;
  });
  return loadPromise;
}

/** Save a result to the account's history (server rejects non-Pro with 403). */
async function save(input: {
  toolSlug: string;
  toolName: string;
  title: string;
  rows: SavedResultRow[];
}): Promise<SavedResult> {
  const res = await fetch("/api/account/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.error || "Could not save the result.";
    if (res.status === 401) throw new Error("Please sign in to save results.");
    throw new Error(msg);
  }
  const created = data.result as SavedResult;
  // Optimistically prepend so the list updates instantly.
  setStore({ results: [created, ...store.results.filter((r) => r.id !== created.id)] });
  return created;
}

async function remove(id: number) {
  setStore({ results: store.results.filter((r) => r.id !== id) });
  try {
    const res = await fetch(`/api/account/history/${id}`, { method: "DELETE" });
    if (!res.ok) load(); // roll back to the server's view on failure
  } catch {
    load();
  }
}

async function clear() {
  setStore({ results: [] });
  try {
    await fetch("/api/account/history", { method: "DELETE" });
  } catch {
    load();
  }
}

/**
 * Forget the in-memory list immediately (no server call). Called on sign-out
 * so the previous account's saved results never linger for the next user on a
 * shared device — mirrors how useFavorites resets its own store.
 */
export function resetHistory() {
  setStore({ results: [] });
}

export function useResultHistory() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    load();
  const onAuth = () => load();
  const onStorage = () => load();
    window.addEventListener("cookchase:auth", onAuth);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("cookchase:auth", onAuth);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const saveResult = useCallback(
    (input: Parameters<typeof save>[0]) => save(input),
    []
  );
  const removeResult = useCallback((id: number) => remove(id), []);
  const clearResults = useCallback(() => clear(), []);

  return {
    results: state.results,
    ready: state.ready,
    saveResult,
    removeResult,
    clearResults
  };
}
