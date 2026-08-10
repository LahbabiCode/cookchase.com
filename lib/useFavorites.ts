"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { resetHistory } from "./useResultHistory";
import { applyEasyModeFromAccount, applyEasyContrastFromAccount } from "./useEasyMode";
import { applyCompactModeFromAccount } from "./useCompactMode";
import {
  DEFAULT_SETTINGS,
  mergeSettings,
  sanitizeSettings,
  type UserSettings
} from "./settings-utils";

const KEY = "cookchase_favorites";
const SETTINGS_KEY = "cookchase_settings";

export type AuthStatus = "loading" | "guest" | "signedIn";

export interface FavoritesSnapshot {
  favorites: string[];
  ready: boolean;
  auth: AuthStatus;
  email: string;
  createdAt: string;
  pro: boolean;
  plan: string;
  settings: UserSettings;
}

// ---- Shared module-level store -------------------------------------------------
// All components using useFavorites read from the same store, so signing in on
// the favorites page immediately updates the header, hearts and badge — no
// broadcast events needed within a page.
let store: FavoritesSnapshot = {
  favorites: [],
  ready: false,
  auth: "loading",
  email: "",
  createdAt: "",
  pro: false,
  plan: "",
  settings: { ...DEFAULT_SETTINGS }
};

const listeners = new Set<() => void>();
let loadPromise: Promise<void> | null = null;

function setStore(patch: Partial<FavoritesSnapshot>) {
  store = { ...store, ...patch };
  for (const fn of Array.from(listeners)) fn();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): FavoritesSnapshot {
  return store;
}

// Stable snapshot for server rendering (client components SSR with the same
// loading defaults, so there is no hydration mismatch).
const serverSnapshot: FavoritesSnapshot = {
  favorites: [],
  ready: false,
  auth: "loading",
  email: "",
  createdAt: "",
  pro: false,
  plan: "",
  settings: { ...DEFAULT_SETTINGS }
};

// ---- Device-local settings (guests, and offline fallback for members) ----------

function readLocalSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return sanitizeSettings(JSON.parse(raw));
    }
  } catch {
    /* private mode or corrupted data */
  }
  return { ...DEFAULT_SETTINGS };
}

function writeLocalSettings(s: UserSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function getServerSnapshot(): FavoritesSnapshot {
  return serverSnapshot;
}

function readLocalFavorites(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
    }
  } catch {
    /* private mode or corrupted data */
  }
  return [];
}

async function load() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const meRes = await fetch("/api/account/me");
      const me = await meRes.json();
      if (me.loggedIn) {
        const localSettings = readLocalSettings();
        const serverSettings = sanitizeSettings(me.settings);
        // Merge: a non-default device preference (e.g. a guest who picked
        // imperial) fills any gap the account hasn't set yet — mirrors how
        // favorites merge. The merged result is pushed back to the server.
        const settings = mergeSettings(serverSettings, localSettings);
        setStore({
          auth: "signedIn",
          email: me.email || "",
          createdAt: me.created_at || "",
          pro: Boolean(me.pro),
          plan: me.plan || "",
          settings
        });
        applyEasyModeFromAccount(settings.easyMode);
        applyEasyContrastFromAccount(settings.easyMode && settings.easyContrast);
        applyCompactModeFromAccount(settings.compactMode);
        // Write the effective settings back to the device key so a stale
        // guest-local value can never override the account's choice on the
        // next load (merge becomes a no-op once both sides agree).
        writeLocalSettings(settings);
        if (
          settings.units !== serverSettings.units ||
          settings.easyMode !== serverSettings.easyMode ||
          settings.compactMode !== serverSettings.compactMode ||
          settings.easyContrast !== serverSettings.easyContrast
        ) {
          try {
            await fetch("/api/account/settings", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(settings)
            });
          } catch {
            /* server stays as-is; device copy already reflects the merge */
          }
        }
        const favRes = await fetch("/api/account/favorites");
        const favData = await favRes.json();
        const serverSlugs = Array.isArray(favData.slugs) ? favData.slugs : [];
        const local = readLocalFavorites();

        // Merge: favorites saved while signed out join the account, then the
        // device cache is cleared (the server becomes the source of truth).
        const merged = Array.from(new Set([...serverSlugs, ...local]));
        if (merged.length !== serverSlugs.length) {
          try {
            await fetch("/api/account/favorites", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slugs: merged })
            });
          } catch {
            /* keep local copy as fallback */
          }
          localStorage.removeItem(KEY);
        }
        setStore({ favorites: merged });
      } else {
        const localSettings = readLocalSettings();
        setStore({
          auth: "guest",
          email: "",
          createdAt: "",
          pro: false,
          plan: "",
          favorites: readLocalFavorites(),
          settings: localSettings
        });
        applyEasyModeFromAccount(localSettings.easyMode);
        applyEasyContrastFromAccount(localSettings.easyMode && localSettings.easyContrast);
        applyCompactModeFromAccount(localSettings.compactMode);
      }
    } catch {
      // Server unreachable — degrade to local favorites/settings for a guest.
      const localSettings = readLocalSettings();
      setStore({
        auth: "guest",
        email: "",
        createdAt: "",
        pro: false,
        plan: "",
        favorites: readLocalFavorites(),
        settings: localSettings
      });
    }
    setStore({ ready: true });
  })().finally(() => {
    loadPromise = null;
  });
  return loadPromise;
}

// ---- Actions (shared, operate on the store) ------------------------------------
// Same-page consumers see every change immediately via the shared store. The
// `storage` event (fires in OTHER tabs) keeps cross-tab sync working.

function toggle(slug: string) {
  const prev = store.favorites;
  const next = prev.includes(slug)
    ? prev.filter((s) => s !== slug)
    : [...prev, slug];

  if (store.auth === "signedIn") {
    // Optimistic update + persist to the server.
    setStore({ favorites: next });
    fetch("/api/account/favorites", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs: next })
    }).catch(() => {
      // On failure, fall back to local storage so the user keeps their picks.
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    });
  } else {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setStore({ favorites: next });
  }
}

function clear() {
  if (store.auth === "signedIn") {
    setStore({ favorites: [] });
    fetch("/api/account/favorites", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs: [] })
    }).catch(() => {});
  } else {
    try {
      localStorage.setItem(KEY, JSON.stringify([]));
    } catch {
      /* ignore */
    }
    setStore({ favorites: [] });
  }
}

/**
 * Update synced user preferences (units / language / easy mode). When signed
 * in the change is persisted to the account so it follows the user on every
 * device; guests keep the preference on this device only. Easy Mode is applied
 * to the DOM immediately (and stays in sync with the header toggle).
 */
function updateSettings(patch: Partial<UserSettings>) {
  const next = sanitizeSettings(patch, store.settings);
  setStore({ settings: next });
  applyEasyModeFromAccount(next.easyMode);
  applyEasyContrastFromAccount(next.easyMode && next.easyContrast);
  applyCompactModeFromAccount(next.compactMode);
  // Always keep the device copy in agreement — otherwise a stale guest-local
  // value would re-win the merge on the next page load and silently override
  // an explicit account choice.
  writeLocalSettings(next);

  if (store.auth === "signedIn") {
    fetch("/api/account/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next)
    }).catch(() => {
      /* offline — the device copy above already persisted the change */
    });
  }
}

async function signIn(email: string, password: string) {
  const res = await fetch("/api/account/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Sign in failed");
  setStore({ auth: "signedIn", email: data.email || email });
  await load(); // merges any device-local favorites AND settings
  window.dispatchEvent(new Event("cookchase:auth")); // e.g. result history reloads
  return data;
}

async function signUp(email: string, password: string) {
  const res = await fetch("/api/account/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not create account");
  setStore({ auth: "signedIn", email: data.email || email });
  await load(); // adopt any favorites + preferences saved on this device
  window.dispatchEvent(new Event("cookchase:auth")); // e.g. result history reloads
  return data;
}

async function signOut() {
  try {
    await fetch("/api/account/logout", { method: "POST" });
  } catch {
    /* ignore */
  }
  // Show the guest view (device-local favorites). These were cleared during
  // the merge, so a fresh guest list starts empty. Also clear the result
  // history store and restore device-local settings so the previous account's
  // preferences never linger on a shared device.
  const localSettings = readLocalSettings();
  setStore({
    auth: "guest",
    email: "",
    createdAt: "",
    pro: false,
    plan: "",
    favorites: readLocalFavorites(),
    settings: localSettings
  });
  applyEasyModeFromAccount(localSettings.easyMode);
  applyEasyContrastFromAccount(localSettings.easyMode && localSettings.easyContrast);
  applyCompactModeFromAccount(localSettings.compactMode);
  resetHistory();
  window.dispatchEvent(new Event("cookchase:auth")); // e.g. result history reloads
}

// ---- Hook -----------------------------------------------------------------------

export function useFavorites() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Initial load (shared — concurrent mounts share one promise). The storage
  // event fires in other tabs when localStorage or the session changes there.
  useEffect(() => {
    load();
    const onStorage = () => {
      if (store.auth === "signedIn") {
        load(); // re-fetch server favorites (e.g. signed out in another tab)
      } else {
        setStore({ favorites: readLocalFavorites() });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const isFavorite = useCallback(
    (slug: string) => state.favorites.includes(slug),
    [state.favorites]
  );

  return {
    favorites: state.favorites,
    ready: state.ready,
    auth: state.auth,
    email: state.email,
    createdAt: state.createdAt,
    pro: state.pro,
    plan: state.plan,
    settings: state.settings,
    isFavorite,
    toggle,
    clear,
    signIn,
    signUp,
    signOut,
    updateSettings
  };
}
