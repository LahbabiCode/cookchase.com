"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Volume2, Square, Lightbulb } from "lucide-react";
import { useEasyMode } from "@/lib/useEasyMode";
import { useLang } from "@/lib/useLang";
import { speechCode } from "@/lib/i18n";

interface VoiceGuideSection {
  label: string;
  content: string;
}

interface VoiceGuideProps {
  title: string;
  intro: string;
  steps: string[];
  /** Extra page sections (about, how-it-works, pro tips…) read after the steps. */
  sections?: VoiceGuideSection[];
  /** FAQ items read last, as "Question … Answer …". */
  faq?: { q: string; a: string }[];
}

type Segment =
  | { kind: "intro"; text: string }
  | { kind: "step"; index: number; text: string }
  | { kind: "section"; index: number; label: string; text: string }
  | { kind: "faq"; index: number; label: string; text: string };

/**
 * Read-aloud, senior-friendly guidance.
 * Renders a large numbered list of plain-language steps and can read them
 * aloud with the Web Speech API. When the tool page passes its other
 * sections (description, formula, tips, FAQ) the reader chains every part
 * in one logical order — overview, steps, sections, questions — and
 * highlights the part being spoken. Only shown when Easy Mode is enabled.
 */
export default function VoiceGuide({
  title,
  intro,
  steps,
  sections = [],
  faq = []
}: VoiceGuideProps) {
  const { enabled } = useEasyMode();
  const { lang, t } = useLang();
  const [speaking, setSpeaking] = useState(false);
  const [current, setCurrent] = useState<number | null>(null);
  const [supported, setSupported] = useState(false);
  const cancelRef = useRef(false);

  // Compute in an effect so the server and first client render agree
  // (avoids a hydration mismatch on the button's disabled state).
  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  // Stop speech when the panel unmounts or easy mode turns off. Both paths
  // must set cancelRef BEFORE cancelling: cancel() fires onend/onerror on the
  // in-flight utterance, and next() uses cancelRef to know not to continue the
  // chain (otherwise the reader would resume after the panel is gone).
  useEffect(() => {
    return () => {
      cancelRef.current = true;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled && speaking) {
      cancelRef.current = true;
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      setCurrent(null);
    }
  }, [enabled, speaking]);

  // The full reading plan: overview → steps → page sections → FAQ. Built
  // once per language/props change; every entry becomes one utterance so the
  // reader can highlight each part as it is spoken.
  const plan = useMemo<Segment[]>(() => {
    const segs: Segment[] = [{ kind: "intro", text: intro }];
    steps.forEach((s, i) =>
      segs.push({ kind: "step", index: i, text: `${t("voice.step", { n: i + 1 })}. ${s}` })
    );
    sections.forEach((sec, i) =>
      segs.push({ kind: "section", index: i, label: sec.label, text: `${sec.label}. ${sec.content}` })
    );
    faq.forEach((f, i) =>
      segs.push({
        kind: "faq",
        index: i,
        label: f.q,
        text: `${t("voice.question")}: ${f.q}. ${t("voice.answer")}: ${f.a}`
      })
    );
    return segs;
  }, [intro, steps, sections, faq, t]);

  if (!enabled) return null;

  const stop = () => {
    cancelRef.current = true;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setCurrent(null);
  };

  const speak = () => {
    if (!supported || plan.length === 0) return;
    cancelRef.current = false;
    window.speechSynthesis?.cancel();
    setSpeaking(true);

    let i = 0;
    const next = () => {
      if (cancelRef.current) return;
      if (i >= plan.length) {
        setSpeaking(false);
        setCurrent(null);
        return;
      }
      const seg = plan[i];
      setCurrent(i);
      const u = new SpeechSynthesisUtterance(seg.text);
      u.rate = 0.9; // slightly slower for older listeners
      u.pitch = 1;
      u.lang = speechCode(lang);
      // Some engines fire onerror AND onend for one interrupted utterance;
      // a per-utterance flag ensures the chain advances exactly once.
      let finished = false;
      const advance = () => {
        if (finished) return;
        finished = true;
        i += 1;
        next();
      };
      u.onend = advance;
      u.onerror = () => {
        // Skip unreadable segments instead of aborting the whole guide.
        advance();
      };
      window.speechSynthesis?.speak(u);
    };
    next();
  };

  const active = current !== null ? plan[current] : null;

  return (
    <section
      aria-label={t("voice.aria")}
      className="mt-6 rounded-2xl border-2 border-sky-200 bg-sky-50 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white">
            <Lightbulb className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink-900">{title}</h2>
            <p className="text-sm text-ink-600">{t("voice.simple")}</p>
          </div>
        </div>
        {speaking ? (
          <button
            onClick={stop}
            className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-700"
          >
            <Square className="h-4 w-4" />
            {t("voice.stop")}
          </button>
        ) : (
          <button
            onClick={speak}
            disabled={!supported}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Volume2 className="h-4 w-4" />
            {t("voice.readAloud")}
          </button>
        )}
      </div>

      {!supported && (
        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-ink-500">
          {t("voice.notSupported")}
        </p>
      )}

      {/* Now-reading status: aria-live so screen readers announce the part
          being spoken; visually it sits above the content as a cue. */}
      <p
        aria-live="polite"
        aria-hidden={!speaking || !active}
        className={`mt-4 min-h-[1.25rem] text-sm font-semibold ${
          speaking && active ? "text-sky-700" : ""
        }`}
      >
        {speaking && active
          ? `${t("voice.nowReading")} ${
              active.kind === "step"
                ? t("voice.step", { n: active.index + 1 })
                : active.kind === "faq"
                  ? t("voice.question")
                  : "label" in active
                    ? active.label
                    : t("voice.overview")
            }`
          : ""}
      </p>

      <p className="mt-1 text-base leading-relaxed text-ink-700">{intro}</p>

      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <li
            key={i}
            className={`flex items-start gap-3 rounded-xl border bg-white p-4 transition ${
              active?.kind === "step" && active.index === i
                ? "border-sky-400 ring-2 ring-sky-200"
                : "border-sky-100"
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
              {i + 1}
            </span>
            <span className="text-base leading-relaxed text-ink-800">{s}</span>
          </li>
        ))}
      </ol>

      {/* Page sections read after the steps — shown so the visitor can
          follow along, highlighted while spoken. */}
      {sections.map((sec, i) => (
        <div
          key={`sec-${i}`}
          className={`mt-4 rounded-xl border bg-white p-4 transition ${
            active?.kind === "section" && active.index === i
              ? "border-sky-400 ring-2 ring-sky-200"
              : "border-sky-100"
          }`}
        >
          <h3 className="text-sm font-bold uppercase tracking-wide text-ink-900">
            {sec.label}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
            {sec.content}
          </p>
        </div>
      ))}

      {/* FAQ items read last, as compact Q&A blocks. */}
      {faq.map((f, i) => (
        <div
          key={`faq-${i}`}
          className={`mt-4 rounded-xl border bg-white p-4 transition ${
            active?.kind === "faq" && active.index === i
              ? "border-sky-400 ring-2 ring-sky-200"
              : "border-sky-100"
          }`}
        >
          <p className="text-sm font-semibold text-ink-900">{f.q}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-700">{f.a}</p>
        </div>
      ))}
    </section>
  );
}
