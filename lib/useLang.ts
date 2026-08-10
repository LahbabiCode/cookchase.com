"use client";

import { useCallback } from "react";
import { t as translate, type Lang } from "./i18n";

// The site is English-only. This hook keeps the same shape every component
// already consumes ({ lang, dir, ready, setLanguage, t }) so no caller needs
// changing — lang is always "en" and setLanguage is a no-op.

export function useLang() {
  /** Translate a key with interpolation — always English. */
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate("en", key, vars),
    []
  );

  return {
    lang: "en" as Lang,
    dir: "ltr" as const,
    ready: true,
    setLanguage: (_next: Lang) => {
      /* English-only — nothing to switch */
    },
    t
  };
}
