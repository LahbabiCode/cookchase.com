// Server-only language resolution. The site is English-only, so the server
// always renders in English — no cookie needed.
import type { Lang } from "./i18n";

export function getServerLang(): Lang {
  return "en";
}
