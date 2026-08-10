"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Sparkles } from "lucide-react";
import FieldHint from "@/components/admin/FieldHint";
import ToolLivePreview from "@/components/admin/ToolLivePreview";
import {
  emptyQuickGuide,
  isCompleteQuickGuide,
  parseQuickGuide,
  serializeQuickGuide
} from "@/lib/quick-guides";
import {
  defaultToolExample,
  parseToolExampleValues,
  serializeToolExampleValues
} from "@/lib/tool-examples";

const inputCls =
  "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

interface ToolData {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  icon: string;
  description: string;
  how_to_use: string;
  formula: string;
  code: string;
  faq: string;
  tips: string;
  quick_guide: string;
  example_hint: string;
  example_values: string;
  meta_title: string;
  meta_description: string;
  featured: number;
  status: string;
  sort_order: number;
}

export default function ToolEditor() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";
  const [data, setData] = useState<ToolData | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew) {
      setData({
        id: 0,
        slug: "",
        name: "",
        tagline: "",
        category: "Calculators",
        icon: "Calculator",
        description: "",
        how_to_use: "",
        formula: "",
        code: "",
        faq: "[]",
        tips: "[]",
        quick_guide: serializeQuickGuide(emptyQuickGuide()),
        example_hint: "",
        example_values: "",
        meta_title: "",
        meta_description: "",
        featured: 0,
        status: "active",
        sort_order: 999
      });
      return;
    }
    fetch(`/api/admin/tools/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [params.id, isNew]);

  const set = (patch: Partial<ToolData>) => setData((d) => (d ? { ...d, ...patch } : d));

  // Quick guide steps are edited as 3 title+text pairs and stored as JSON.
  const guideSteps = parseQuickGuide(data?.quick_guide);
  const setGuideStep = (i: number, patch: Partial<{ title: string; text: string; example?: string }>) => {
    if (!data) return;
    const steps = parseQuickGuide(data.quick_guide);
    while (steps.length < i + 1) steps.push({ title: "", text: "" });
    steps[i] = { ...steps[i], ...patch };
    set({ quick_guide: serializeQuickGuide(steps) });
  };

  const validateFaq = (s: string) => {
    try {
      const v = JSON.parse(s);
      return Array.isArray(v);
    } catch {
      return false;
    }
  };

  const validateExampleValues = (s: string) => {
    if (!s.trim()) return true;
    try {
      const v = JSON.parse(s);
      return v && typeof v === "object" && !Array.isArray(v);
    } catch {
      return false;
    }
  };

  // The example values editor is a JSON object of field-name → value pairs.
  // For a built-in tool we pre-fill it with the widget's defaults so the admin
  // sees the exact field names that tool understands.
  const fillExampleDefaults = () => {
    if (!data) return;
    const def = defaultToolExample(data.slug);
    set({
      example_hint: def.hint || data.example_hint,
      example_values: serializeToolExampleValues(def.values)
    });
  };

  const exampleValuesValid = validateExampleValues(data?.example_values ?? "");
  // Tools like the Recipe Comparator / Weekly Menu Generator have no
  // JSON-editable defaults — their examples are generated in code. Tell the
  // admin up front so the values field doesn't look broken.
  const hasEditableDefaults = Object.keys(defaultToolExample(data?.slug ?? "").values).length > 0;

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setSaved(false);
    setError("");
    if (!data.name.trim() && !data.slug.trim()) {
      setError("Give the tool a name or slug.");
      setSaving(false);
      return;
    }
    if (!validateFaq(data.faq)) {
      setError("FAQ must be a valid JSON array, e.g. [{\"q\":\"Question\",\"a\":\"Answer\"}]");
      setSaving(false);
      return;
    }
    if (isNew && !isCompleteQuickGuide(parseQuickGuide(data.quick_guide))) {
      setError(
        "Every new tool needs a Quick guide: give all 3 steps a title and a one-line description — visitors see this above the tool."
      );
      setSaving(false);
      return;
    }
    if (!validateExampleValues(data.example_values)) {
      setError(
        "Example values must be a valid JSON object, e.g. {\"weight\":\"70\",\"unit\":\"kg\"} — or leave it empty."
      );
      setSaving(false);
      return;
    }
    try {
      if (isNew) {
        const res = await fetch("/api/admin/tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to create tool.");
          setSaving(false);
          return;
        }
        router.push(`/admin/tools/${json.id}/edit`);
        router.refresh();
      } else {
        const res = await fetch(`/api/admin/tools/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (!res.ok) {
          setError("Failed to save.");
          setSaving(false);
          return;
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      setError("Something went wrong saving the tool.");
    }
    setSaving(false);
  };

  const remove = async () => {
    if (!data || isNew) return;
    if (!confirm(`Delete "${data.name}" permanently?`)) return;
    await fetch(`/api/admin/tools/${data.id}`, { method: "DELETE" });
    router.push("/admin/tools");
    router.refresh();
  };

  if (loading) {
    return <div className="animate-pulse p-10 text-center text-sm text-ink-400">Loading…</div>;
  }

  if (!data) {
    return <div className="p-10 text-center text-sm text-ink-500">Tool not found.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link
          href="/admin/tools"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tools
        </Link>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button
              onClick={remove}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </button>
        </div>
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink-900">
        {isNew ? "New tool" : `Edit: ${data.name}`}
      </h1>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
        {/* Basic info */}
        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Basic information
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Name</label>
              <input
                className={inputCls}
                value={data.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="Recipe Scaler"
              />
              <FieldHint>The tool&apos;s title — what visitors see on cards and at the top of the page. Keep it short and clear, e.g. “Recipe Scaler”.</FieldHint>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Slug (URL)</label>
              <input
                className={inputCls}
                value={data.slug}
                onChange={(e) =>
                  set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })
                }
                placeholder="my-tool"
              />
              <p className="mt-1.5 text-xs text-ink-400">Page lives at /tools/{data.slug || "…"}</p>
              <FieldHint>Lowercase letters, numbers and dashes only. This becomes the web address, so choose it once — changing it later breaks old links.</FieldHint>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Tagline</label>
              <input
                className={inputCls}
                value={data.tagline}
                onChange={(e) => set({ tagline: e.target.value })}
                placeholder="Short one-line description shown on cards"
              />
              <FieldHint>One sentence shown on cards and in Google results. Explain what the tool does as if telling a friend, e.g. “Scale any recipe up or down in seconds”.</FieldHint>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Category</label>
              <input
                className={inputCls}
                value={data.category}
                onChange={(e) => set({ category: e.target.value })}
                placeholder="Calculators"
              />
              <FieldHint>Groups related tools on the /tools page. Reuse an existing category name so the tool appears alongside similar ones.</FieldHint>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Icon</label>
              <select
                className={inputCls}
                value={data.icon}
                onChange={(e) => set({ icon: e.target.value })}
              >
                {[
                  "Calculator",
                  "Scale",
                  "Thermometer",
                  "Coins",
                  "Beef",
                  "CupSoda",
                  "Salad",
                  "Repeat",
                  "CalendarDays",
                  "Timer",
                  "Waves",
                  "Pizza",
                  "Candy",
                  "Wheat",
                  "Egg",
                  "Droplets",
                  "Snowflake",
                  "Coffee",
                  "Flame",
                  "Utensils",
                  "Heart",
                  "Sparkles",
                  "BookOpen"
                ].map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
              <FieldHint>A small picture shown on the card and page header. Pick one that suggests the tool — a calculator, a thermometer, a pizza…</FieldHint>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Status</label>
              <select
                className={inputCls}
                value={data.status}
                onChange={(e) => set({ status: e.target.value })}
              >
                <option value="active">Active (visible)</option>
                <option value="hidden">Hidden</option>
              </select>
              <FieldHint>“Active” shows the tool to visitors. “Hidden” keeps it out of sight while you still work on it.</FieldHint>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Sort order</label>
              <input
                type="number"
                className={inputCls}
                value={data.sort_order}
                onChange={(e) => set({ sort_order: Number(e.target.value) || 0 })}
              />
              <FieldHint>Lower numbers appear first on the /tools page. 0 sorts near the top; 999 puts the tool at the end.</FieldHint>
            </div>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={data.featured === 1}
                onChange={(e) => set({ featured: e.target.checked ? 1 : 0 })}
                className="h-4 w-4 rounded border-ink-300 text-brand-600"
              />
              <span className="text-sm font-medium text-ink-700">
                Featured — show on homepage tool grid
              </span>
            </label>
            <div className="sm:col-span-2">
              <FieldHint>Featured tools are highlighted on the homepage. Choose your best and most popular tools.</FieldHint>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Page content
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Description{" "}
                <span className="font-normal text-ink-400">
                  (blank line between paragraphs)
                </span>
              </label>
              <textarea
                className={`${inputCls} min-h-32`}
                value={data.description}
                onChange={(e) => set({ description: e.target.value })}
              />
              <FieldHint>The main text visitors read below the calculator. Write in plain language, one idea per paragraph. A blank line between paragraphs creates a new paragraph.</FieldHint>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                How to use{" "}
                <span className="font-normal text-ink-400">(supports markdown)</span>
              </label>
              <textarea
                className={`${inputCls} min-h-28`}
                value={data.how_to_use}
                onChange={(e) => set({ how_to_use: e.target.value })}
              />
              <FieldHint>Step-by-step instructions shown under “How to use it”. Write short numbered steps a home cook can follow. Supports markdown: numbered lists, **bold**, # headings.</FieldHint>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  Simple explanation{" "}
                  <span className="font-normal text-ink-400">(markdown, shown to visitors as “How this tool works”)</span>
                </label>
                <textarea
                  className={`${inputCls} min-h-32`}
                  value={data.formula}
                  onChange={(e) => set({ formula: e.target.value })}
                />
                <FieldHint>Explain in plain words how the tool calculates — visitors are home cooks, not developers. Example: “We multiply every ingredient by the number of servings you need.” No formulas, no jargon.</FieldHint>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  Code (internal only){" "}
                  <span className="font-normal text-ink-400">— never shown on the site</span>
                </label>
                <textarea
                  className={`${inputCls} min-h-32 font-mono text-xs`}
                  value={data.code}
                  onChange={(e) => set({ code: e.target.value })}
                />
                <FieldHint>Private notes for you only — visitors never see this. You can keep the widget code, formulas or dev notes here.</FieldHint>
              </div>
            </div>
          </div>
        </section>

        {/* Quick guide (3 steps) — id="quick-guide" so the dashboard's Guide
            feedback card can deep-link straight to this section. */}
        <section id="quick-guide" className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
            Quick guide — 3 steps
            {isNew && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                Required
              </span>
            )}
          </h2>
          <p className="mt-1 text-xs text-ink-400">
            Three short steps shown at the top of the tool page so visitors know
            exactly what to enter and what they get back. Shown automatically —
            no code needed.
          </p>
          <div className="mt-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => {
              const s = guideSteps[i] ?? { title: "", text: "", example: "" };
              return (
                <div key={i} className="space-y-2">
                  <div className="grid gap-3 lg:grid-cols-[180px_1fr]">
                    <input
                      className={inputCls}
                      placeholder={`Step ${i + 1} title`}
                      value={s.title}
                      onChange={(e) => setGuideStep(i, { title: e.target.value })}
                    />
                    <input
                      className={inputCls}
                      placeholder="What the visitor does or gets here"
                      value={s.text}
                      onChange={(e) => setGuideStep(i, { text: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[180px_1fr]">
                    <span className="text-xs font-medium text-ink-400 lg:text-right lg:pt-2">
                      Example (optional)
                    </span>
                    <input
                      className={inputCls}
                      placeholder="e.g. 70 kg → 2,450 ml"
                      value={s.example ?? ""}
                      onChange={(e) => setGuideStep(i, { example: e.target.value })}
                    />
                  </div>
                </div>
              );
            })}
            <FieldHint>
              The Example line is a one-line numeric demo shown in small gray text inside
              the card — e.g. “2 cups flour → 250 g” — so visitors see a real result before
              they type anything. Optional, but every built-in tool ships one.
              Example for a scaling tool: 1. “Enter servings” — the amounts your recipe
              makes and what you need. 2. “Add ingredients” — each with its amount and
              unit. 3. “Get scaled amounts” — everything recalculated instantly. All 3
              steps are required for new tools.
            </FieldHint>
          </div>
        </section>

        {/* "Try an example" — the hint sentence and the values the button
            fills. Both live in the database and are published to the widget
            by ExampleBridge on the live page, so editing them here takes
            effect with no code changes. */}
        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-500">
            <Sparkles className="h-4 w-4 text-brand-600" />
            Try an example
          </h2>
          <p className="mt-1 text-xs text-ink-400">
            The sentence visitors see next to the “Try an example” button, and
            the values that button fills. Edit them here — no code needed.
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Hint text
              </label>
              <input
                className={inputCls}
                value={data.example_hint}
                onChange={(e) => set({ example_hint: e.target.value })}
                placeholder="e.g. See how much alcohol remains after simmering 250 ml of wine."
              />
              <FieldHint>
                The one-line example shown beside the button on the tool page.
                Write it as a short sentence a home cook understands instantly —
                pick a realistic scenario, e.g. “Brine a 1.5 kg whole chicken overnight”.
                Leave it blank to keep the tool&apos;s built-in hint.
              </FieldHint>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  Values the button fills{" "}
                  <span className="font-normal text-ink-400">— JSON object</span>
                </label>
                <button
                  type="button"
                  onClick={fillExampleDefaults}
                  className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                >
                  <Sparkles className="h-3 w-3" />
                  Fill with defaults
                </button>
              </div>
              <textarea
                className={`${inputCls} min-h-32 font-mono text-xs`}
                value={data.example_values}
                onChange={(e) => set({ example_values: e.target.value })}
                placeholder='{"weight":"70","unit":"kg"}'
              />
              {!exampleValuesValid && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  That isn&apos;t a valid JSON object — fix it before saving.
                </p>
              )}
              <FieldHint>
                A JSON object of field-name → value pairs. Each field name must
                match one the tool understands — press <strong>Fill with
                defaults</strong> to see the exact names and starting values
                this tool uses (e.g. {"{"}"weight":"70","unit":"kg"{"}"}). The
                button on the live page fills these when pressed. Leave it
                empty to keep the tool&apos;s built-in example values.
              </FieldHint>
              {!hasEditableDefaults && (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  This tool&apos;s example is built into the widget (it generates
                  its own values), so only the hint text above takes effect —
                  values entered here won&apos;t change what the button fills.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* FAQ + tips */}
        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            FAQ & tips
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                FAQ{" "}
                <span className="font-normal text-ink-400">
                  — JSON array: [{"{"}"q":"Question","a":"Answer"{"}"}]
                </span>
              </label>
              <textarea
                className={`${inputCls} min-h-28 font-mono text-xs`}
                value={data.faq}
                onChange={(e) => set({ faq: e.target.value })}
              />
              <FieldHint>Questions visitors might ask, with short answers. Each pair becomes a clickable box on the page and helps with Google SEO. Copy the format shown: a JSON array of {"{"}"q":"…","a":"…"{"}"} objects.</FieldHint>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Tips{" "}
                <span className="font-normal text-ink-400">
                  — JSON array of strings: ["tip one","tip two"]
                </span>
              </label>
              <textarea
                className={`${inputCls} min-h-20 font-mono text-xs`}
                value={data.tips}
                onChange={(e) => set({ tips: e.target.value })}
              />
              <FieldHint>Short pro tips shown as a checklist with ✓ icons. Simple JSON array of strings, e.g. ["tip one", "tip two"].</FieldHint>
            </div>
          </div>
        </section>

        {/* SEO */}
        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            SEO settings
          </h2>
          <div className="mt-4 grid gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Meta title</label>
              <input
                className={inputCls}
                value={data.meta_title}
                onChange={(e) => set({ meta_title: e.target.value })}
              />
              <p className="mt-1.5 text-xs text-ink-400">
                {data.meta_title.length}/60 characters recommended
              </p>
              <FieldHint>The headline Google shows in search results. Aim for 50–60 characters and include the tool name, e.g. “Recipe Scaler — Scale Any Recipe Up or Down”.</FieldHint>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Meta description
              </label>
              <textarea
                className={`${inputCls} min-h-20`}
                value={data.meta_description}
                onChange={(e) => set({ meta_description: e.target.value })}
              />
              <p className="mt-1.5 text-xs text-ink-400">
                {data.meta_description.length}/160 characters recommended
              </p>
              <FieldHint>The short description under the title in Google results. In 150–160 characters, say what the tool does and why it&apos;s useful.</FieldHint>
            </div>
          </div>
        </section>
        </div>

        {/* Live preview column */}
        <aside className="min-w-0">
          <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
            <ToolLivePreview tool={data} />
          </div>
        </aside>
      </div>
    </div>
  );
}
