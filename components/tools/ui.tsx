"use client";

import { useState, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Sparkles,
  Lightbulb,
  PenLine,
  SlidersHorizontal,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Pin,
  Mail,
  Link2
} from "lucide-react";
import { useLang } from "@/lib/useLang";
import { t } from "@/lib/i18n";
import { useToolFacts } from "./faqStore";
import { useToolExample, getToolExample, exStr, exNum, exArr } from "./exampleStore";
import { buildShareHrefs, openShare } from "@/lib/share";

export { getToolExample, exStr, exNum, exArr };

function useTs(): (key: string, vars?: Record<string, string | number>) => string {
  const { lang } = useLang();
  return (key: string, vars?: Record<string, string | number>) => t(lang, key, vars);
}

export function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

export const selectCls = inputCls;

export function NumberInput({
  value,
  onChange,
  min = 0,
  step = "any",
  placeholder
}: {
  value: string;
  onChange: (v: string) => void;
  min?: number;
  step?: string | number;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      min={min}
      step={step}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    />
  );
}

export function ResultRow({
  label,
  value,
  sub,
  strong = false
}: {
  label: string;
  value: string;
  sub?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 py-2.5 last:border-0">
      <div>
        <span className="text-sm text-brand-100/90">{label}</span>
        {sub && <p className="text-xs text-brand-200/70">{sub}</p>}
      </div>
      <span
        className={`readout text-right ${
          strong ? "text-base text-copper-200" : "text-sm text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function ResultCard({
  title,
  children,
  note
}: {
  title?: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="readout-panel rounded-2xl p-5">
      {title && (
        <h3 className="eyebrow flex items-center gap-2 text-copper-200">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-copper-400" />
          {title}
        </h3>
      )}
      <div className="mt-2">{children}</div>
      {note && <p className="mt-3 text-xs text-brand-200/80">{note}</p>}
    </div>
  );
}

export function CopyButton({
  text,
  labelKey = "widget.copy",
  title
}: {
  text: string;
  /** i18n key for the idle label — defaults to "Copy". */
  labelKey?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);
  const ts = useTs();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <button
      onClick={copy}
      title={title}
      className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-ink-100"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? ts("widget.copied") : ts(labelKey)}
    </button>
  );
}

export function TryExampleButton({ onExample }: { onExample: () => void }) {
  const ts = useTs();
  return (
    <button
      onClick={onExample}
      className="inline-flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
      title={ts("widget.tryExampleTitle")}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {ts("widget.tryExample")}
    </button>
  );
}

/** The tool slug from the current URL (tool pages live at /tools/[slug]). */
function toolSlugFromPath(): string {
  if (typeof window === "undefined") return "";
  const m = window.location.pathname.match(/\/tools\/([^/]+)/);
  return m ? m[1] : "";
}

/**
 * "Share this example" — shown after the visitor presses "Try an example".
 * Reads the tool's LIVE computed facts (published to the shared store by the
 * widget) and shares them along with the tool's URL on social media.
 */
export function ShareExampleButton({ hint }: { hint: string }) {
  const ts = useTs();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const slug = toolSlugFromPath();
  const facts = useToolFacts(slug);

  // Close the popover on an outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const url = typeof window !== "undefined" ? window.location.href : "";

  const factLine = Object.values(facts)
    .filter((f) => f.value && f.value.trim())
    .map((f) => `${f.label}: ${f.value}`)
    .join(" · ");

  // The shared message. The tool URL travels separately (X and email append it
  // themselves), so it never appears twice in the tweet.
  const text = `Try this example: ${hint}${factLine ? ` — ${factLine}` : ""}`;
  const hrefs = url ? buildShareHrefs(url, text, text) : null;

  const shares = [
    { label: ts("share.onFacebook"), href: hrefs?.facebook ?? "", Icon: Facebook },
    { label: ts("share.onX"), href: hrefs?.x ?? "", Icon: Twitter },
    { label: ts("share.onPinterest"), href: hrefs?.pinterest ?? "", Icon: Pin },
    { label: ts("share.onLinkedIn"), href: hrefs?.linkedin ?? "", Icon: Linkedin },
    { label: ts("share.byEmail"), href: hrefs?.email ?? "", Icon: Mail }
  ];

  // Copy the bare tool link (not the whole message).
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
        title={ts("widget.shareExampleTitle")}
      >
        <Share2 className="h-3.5 w-3.5" />
        {ts("widget.shareExample")}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-ink-200 bg-white p-3 shadow-lg" role="menu">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            {ts("share.share")}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {shares.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={url ? href : undefined}
                onClick={(e) => {
                  if (!url) return;
                  if (openShare(href)) e.preventDefault();
                }}
                target={href.startsWith("mailto:") ? undefined : "_blank"}
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                role="menuitem"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-ink-100 bg-white text-ink-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
            <button
              onClick={copyLink}
              aria-label={ts("share.copyLink")}
              title={ts("share.copyLink")}
              role="menuitem"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-ink-100 bg-white text-ink-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-ink-400">{text}</p>
        </div>
      )}
    </div>
  );
}


const GUIDE_ICONS = [PenLine, SlidersHorizontal, Sparkles];

export function QuickGuide({ steps }: { steps: { title: string; text: string; example?: string }[] }) {
  const ts = useTs();
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {steps.map((step, i) => {
        const Icon = GUIDE_ICONS[i % GUIDE_ICONS.length];
        return (
          <div
            key={i}
            className="flex items-start gap-2.5 rounded-xl border border-ink-100 bg-white/70 px-3 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/40"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"
            >
              <Icon className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-ink-700">
                <span className="text-brand-600">{i + 1}.</span> {step.title}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-ink-500">{step.text}</p>
              {step.example && (
                <p className="mt-1 font-mono text-[11px] leading-snug text-ink-400">
                  {ts("widget.examplePrefix")} {step.example}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ExampleHelper({ hint, onExample }: { hint: string; onExample: () => void }) {
  const ts = useTs();
  // An admin can override the hint sentence from the tool editor (stored in
  // tools.example_hint and published to the store by ExampleBridge). When set,
  // it wins over the widget's built-in hint; blank falls back to the default.
  const slug = toolSlugFromPath();
  const stored = useToolExample(slug);
  const shownHint = stored.hint && stored.hint.trim() ? stored.hint : hint;
  // The share button appears only after the visitor has pressed "Try an
  // example" — the share text reads the tool's live computed facts, which
  // are published to the shared store once the example values load.
  const [tried, setTried] = useState(false);
  const handleExample = () => {
    setTried(true);
    onExample();
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/60 p-3.5">
      <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-600">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        <span>
          <strong className="font-semibold text-brand-700">{ts("widget.tryLabel")}</strong> {shownHint}
        </span>
      </p>
      <div className="flex items-center gap-2">
        <TryExampleButton onExample={handleExample} />
        {tried && <ShareExampleButton hint={shownHint} />}
        <CopyButton
          text={shownHint}
          labelKey="widget.copyExample"
          title={ts("widget.copyExampleTitle")}
        />
      </div>
    </div>
  );
}

export function ResetButton({ onReset }: { onReset: () => void }) {
  const ts = useTs();
  return (
    <button
      onClick={onReset}
      className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-ink-100"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      {ts("widget.reset")}
    </button>
  );
}

export function RemoveButton({ onRemove }: { onRemove: () => void }) {
  const ts = useTs();
  return (
    <button
      onClick={onRemove}
      aria-label={ts("widget.removeRow")}
      className="flex h-8 w-8 items-center justify-center rounded-md text-ink-400 transition hover:bg-red-50 hover:text-red-600"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

export function AddRowButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-ink-300 bg-white px-3 py-2 text-sm font-medium text-ink-600 transition hover:border-brand-400 hover:text-brand-600"
    >
      <span className="text-base leading-none">+</span>
      {children}
    </button>
  );
}

export function SliderInput({
  value,
  onChange,
  min,
  max,
  step,
  display
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  display: (v: number) => string;
}) {
  return (
    <div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2"
      />
      <div className="mt-1 text-sm font-semibold text-brand-600">{display(value)}</div>
    </div>
  );
}

export function useNumber(text: string): number {
  return parseFloat(text) || 0;
}

export function fmt(n: number, digits = 2): string {
  if (!isFinite(n)) return "0";
  const rounded = Math.round(n * 10 ** digits) / 10 ** digits;
  return rounded.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function fraction(n: number): string {
  if (!isFinite(n) || n <= 0) return "0";
  const fracs: [number, string][] = [
    [1, "1"],
    [0.875, "7/8"],
    [0.75, "3/4"],
    [0.6667, "2/3"],
    [0.625, "5/8"],
    [0.5, "1/2"],
    [0.375, "3/8"],
    [0.3333, "1/3"],
    [0.25, "1/4"],
    [0.1667, "1/6"],
    [0.125, "1/8"]
  ];
  const whole = Math.floor(n);
  const frac = n - whole;
  for (const [val, label] of fracs) {
    if (Math.abs(frac - val) < 0.02) {
      if (whole === 0) return label;
      return `${whole} ${label}`;
    }
  }
  return fmt(n, 2);
}

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}
