// Pure user-settings helpers. No DB imports, so the node test runner can load
// this module directly (DB access lives in account-auth.ts).
//
// Settings are the per-account preferences that sync across devices with the
// same account system used for favorites: preferred measurement units and the
// two layout modes — Easy Mode (accessibility: larger text, higher contrast)
// and Compact Mode (denser spacing, more tools per screen for expert users).
// The two modes are opposites and mutually exclusive.
//
// The site is English-only: the `language` field still exists for legacy rows
// but only ever holds "en".
//
// Easy Mode also has a last-resort sub-option, easyContrast: a black
// background with bright white text and clearly outlined cards for people with
// severe low vision. It only takes effect while Easy Mode is on.

export type UnitsPref = "metric" | "imperial";
export type LanguagePref = "en";

export interface UserSettings {
  units: UnitsPref;
  language: LanguagePref;
  easyMode: boolean;
  compactMode: boolean;
  easyContrast: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  units: "metric",
  language: "en",
  easyMode: false,
  compactMode: false,
  easyContrast: false
};

const UNITS: UnitsPref[] = ["metric", "imperial"];
const LANGUAGES: LanguagePref[] = ["en"];

/**
 * Validate + normalize a partial settings patch. Unknown or invalid values
 * fall back to the current setting (or the default when nothing is given).
 * The result is always a complete, valid UserSettings object.
 */
export function sanitizeSettings(
  input: Partial<UserSettings> | null | undefined,
  current: UserSettings = DEFAULT_SETTINGS
): UserSettings {
  const raw = input && typeof input === "object" ? input : {};
  return {
    units: UNITS.includes(raw.units as UnitsPref) ? (raw.units as UnitsPref) : current.units,
    language: LANGUAGES.includes(raw.language as LanguagePref)
      ? (raw.language as LanguagePref)
      : current.language,
    easyMode:
      typeof raw.easyMode === "boolean" ? raw.easyMode : Boolean(current.easyMode),
    compactMode:
      typeof raw.compactMode === "boolean" ? raw.compactMode : Boolean(current.compactMode),
    easyContrast:
      typeof raw.easyContrast === "boolean"
        ? raw.easyContrast
        : Boolean(current.easyContrast)
  };
}

/**
 * Merge device-local settings into server settings at sign-in, mirroring how
 * favorites merge. The server is the source of truth for values the user has
 * actually set there; a non-default device preference fills any gap (e.g. a
 * guest who picked imperial keeps it after creating an account).
 */
export function mergeSettings(
  server: UserSettings,
  local: Partial<UserSettings> | null | undefined
): UserSettings {
  const merged = { ...server };
  const loc = sanitizeSettings(local, server);
  // Only adopt the local value when the server side is still at its default
  // (meaning the user never touched it on this account yet).
  if (server.units === DEFAULT_SETTINGS.units) merged.units = loc.units;
  if (server.language === DEFAULT_SETTINGS.language) merged.language = loc.language;
  if (server.easyMode === DEFAULT_SETTINGS.easyMode) merged.easyMode = loc.easyMode;
  if (server.compactMode === DEFAULT_SETTINGS.compactMode)
    merged.compactMode = loc.compactMode;
  if (server.easyContrast === DEFAULT_SETTINGS.easyContrast)
    merged.easyContrast = loc.easyContrast;
  return merged;
}

/** True when any value differs from the defaults (used to decide PUTs). */
export function settingsDifferFromDefaults(s: UserSettings): boolean {
  return (
    s.units !== DEFAULT_SETTINGS.units ||
    s.language !== DEFAULT_SETTINGS.language ||
    s.easyMode !== DEFAULT_SETTINGS.easyMode ||
    s.compactMode !== DEFAULT_SETTINGS.compactMode ||
    s.easyContrast !== DEFAULT_SETTINGS.easyContrast
  );
}
