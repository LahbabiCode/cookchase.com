"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Search, X, CornerDownLeft, FileText, Mic, Square } from "lucide-react";
import { ToolIcon } from "@/lib/icons";
import Highlight from "./Highlight";
import { useLang } from "@/lib/useLang";
import { speechCode } from "@/lib/i18n";

interface ToolHit {
  slug: string;
  name: string;
  category: string;
  icon: string;
  tagline: string;
}

interface ArticleHit {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
}

interface SearchData {
  tools: ToolHit[];
  articles: ArticleHit[];
}

interface Item {
  type: "tool" | "article";
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  icon?: string;
}

/** Minimal typing for the Web Speech API speech recognizer. */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: {
    resultIndex: number;
    results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
  }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as SpeechRecognitionWindow;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function SearchBox({
  className = "",
  autoFocus = false,
  onNavigate
}: {
  className?: string;
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const uid = useId();
  const { lang, t } = useLang();
  const listId = `search-list-${uid.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchData>({ tools: [], articles: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const trimmed = query.trim();

  // Debounced search with AbortController so slow responses for older queries
  // can never overwrite the results of the latest keystroke.
  useEffect(() => {
    if (trimmed.length < 2) {
      setData({ tools: [], articles: [] });
      setLoading(false);
      setOpen(false);
      setActive(-1);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setData({ tools: [], articles: [] });
    setActive(-1);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal
        });
        if (!res.ok) return;
        const json = (await res.json()) as SearchData;
        setData(json);
        setOpen(true);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          /* ignore network errors */
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Detect Web Speech API support in an effect (not during render) so the
  // server HTML and first client paint agree — same pattern as VoiceGuide.
  useEffect(() => {
    setSupported(Boolean(getSpeechRecognitionCtor()));
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  // Auto-dismiss voice error hints after a few seconds.
  useEffect(() => {
    if (!voiceError) return;
    const t = setTimeout(() => setVoiceError(""), 4000);
    return () => clearTimeout(t);
  }, [voiceError]);

  const items: Item[] = [
    ...data.tools.map((t) => ({
      type: "tool" as const,
      slug: t.slug,
      title: t.name,
      subtitle: t.tagline,
      category: t.category,
      icon: t.icon
    })),
    ...data.articles.map((a) => ({
      type: "article" as const,
      slug: a.slug,
      title: a.title,
      subtitle: a.excerpt,
      category: a.category
    }))
  ];

  const totalHits = data.tools.length + data.articles.length;

  function go(slug: string) {
    setOpen(false);
    setQuery("");
    onNavigate?.();
    router.push(slug);
  }

  function goSearch() {
    if (trimmed.length < 2) return;
    setOpen(false);
    setQuery("");
    onNavigate?.();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (items.length === 0) return;
      setOpen(true);
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length === 0) return;
      setActive((a) => (a - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && active < items.length) {
        const it = items[active];
        go(it.type === "tool" ? `/tools/${it.slug}` : `/blog/${it.slug}`);
      } else if (trimmed.length >= 2) {
        goSearch();
      }
    }
  }

  function toggleVoice() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    // Already listening — stop instead of stacking a second recognizer.
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    setVoiceError("");
    setQuery("");
    setActive(-1);
    const rec = new Ctor();
    rec.lang = speechCode(lang);
    rec.interimResults = true; // live transcript as the user speaks
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let finalText = "";

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      const text = (finalText + interim).trim();
      // Feed the transcript straight into query — the debounced search effect
      // below picks it up and fetches suggestions immediately.
      setQuery(text);
      if (text.length >= 2) setOpen(true);
    };

    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      if (finalText.trim().length >= 2) {
        setOpen(true);
        inputRef.current?.focus();
      }
    };

    rec.onerror = (event) => {
      setListening(false);
      recognitionRef.current = null;
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setVoiceError(t("search.micBlocked"));
      } else if (event.error === "no-speech") {
        setVoiceError(t("search.noSpeech"));
      } else if (event.error === "network") {
        setVoiceError(t("search.network"));
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
      recognitionRef.current = null;
      setVoiceError(t("search.unavailable"));
    }
  }

  const activeItem =
    active >= 0 && active < items.length ? items[active] : null;

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open && trimmed.length >= 2}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeItem ? `${listId}-opt-${active}` : undefined
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 2) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (trimmed.length >= 2 && totalHits > 0) setOpen(true);
          }}
          placeholder={listening ? t("search.listening") : t("search.placeholder")}
          aria-label={t("search.placeholder")}
          autoComplete="off"
          autoFocus={autoFocus}
          className={`h-9 w-full rounded-lg border border-ink-200 bg-ink-50/60 pl-9 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 ${
            supported ? "pr-16" : "pr-8"
          } ${listening ? "border-brand-400 ring-2 ring-brand-100" : ""}`}
        />
        {query && !listening && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
              setActive(-1);
              inputRef.current?.focus();
            }}
            aria-label={t("search.clear")}
            className={`absolute top-1/2 -translate-y-1/2 text-ink-400 transition hover:text-ink-600 ${
              supported ? "right-10" : "right-2.5"
            }`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {supported && (
          <button
            onClick={toggleVoice}
            aria-label={listening ? t("search.stopVoice") : t("search.byVoice")}
            aria-pressed={listening}
            title={listening ? t("search.stopVoice") : t("search.byVoice")}
            className={`absolute top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full transition ${
              listening
                ? "right-2 animate-pulse bg-brand-700 text-white shadow-sm"
                : "right-2 text-ink-400 hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            {listening ? <Square className="h-3 w-3" /> : <Mic className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {voiceError && !open && (
        <p className="absolute left-0 right-0 top-full z-40 mt-1.5 rounded-lg border border-copper-300 bg-copper-50 px-3 py-1.5 text-xs text-copper-800 shadow-sm">
          {voiceError}
        </p>
      )}

      {open && trimmed.length >= 2 && (
        <div
          id={listId}
          role="listbox"
          aria-label={t("search.suggestions")}
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xl"
        >
          {loading ? (
            <p className="px-4 py-3 text-sm text-ink-400">{t("search.searching")}</p>
          ) : totalHits === 0 ? (
            <p className="px-4 py-4 text-sm text-ink-500">
              {t("search.noResults", { q: trimmed })}
            </p>
          ) : (
            <>
              <ul className="max-h-80 overflow-y-auto py-1">
                {data.tools.length > 0 && (
                  <li className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    {t("search.tools")}
                  </li>
                )}
                {data.tools.map((t, i) => (
                  <li
                    key={`tool-${t.slug}`}
                    id={`${listId}-opt-${i}`}
                    role="option"
                    aria-selected={active === i}
                  >
                    <button
                      onClick={() => go(`/tools/${t.slug}`)}
                      onMouseEnter={() => setActive(i)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left transition ${
                        active === i ? "bg-brand-50" : ""
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                        <ToolIcon name={t.icon} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink-900">
                          <Highlight text={t.name} query={trimmed} />
                        </span>
                        <span className="block truncate text-xs text-ink-500">
                          <Highlight text={t.tagline} query={trimmed} />
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-500">
                        {t.category}
                      </span>
                    </button>
                  </li>
                ))}
                {data.articles.length > 0 && (
                  <li className="border-t border-ink-100 px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    {t("search.articles")}
                  </li>
                )}
                {data.articles.map((a, i) => {
                  const idx = data.tools.length + i;
                  return (
                    <li
                      key={`article-${a.slug}`}
                      id={`${listId}-opt-${idx}`}
                      role="option"
                      aria-selected={active === idx}
                    >
                      <button
                        onClick={() => go(`/blog/${a.slug}`)}
                        onMouseEnter={() => setActive(idx)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left transition ${
                          active === idx ? "bg-brand-50" : ""
                        }`}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
                          <FileText className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink-900">
                            <Highlight text={a.title} query={trimmed} />
                          </span>
                          <span className="block truncate text-xs text-ink-500">
                            <Highlight text={a.excerpt} query={trimmed} />
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold text-ink-500">
                          {a.category}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Link
                href={`/search?q=${encodeURIComponent(trimmed)}`}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                  onNavigate?.();
                }}
                className="flex items-center justify-center gap-1.5 border-t border-ink-100 bg-ink-50/60 px-4 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
              >
                {t("search.seeAll", { n: totalHits, q: trimmed })}
                <CornerDownLeft className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
