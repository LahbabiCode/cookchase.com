"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

const inputCls =
  "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

interface Section {
  key: string;
  title: string;
  subtitle: string;
  content: string;
  badge: string;
  enabled: number;
}

function prettifyKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SectionsAdmin() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [savedKey, setSavedKey] = useState("");

  useEffect(() => {
    fetch("/api/admin/sections")
      .then((r) => r.json())
      .then((data) => {
        setSections(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const update = (key: string, patch: Partial<Section>) =>
    setSections((s) => s.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const save = async (s: Section) => {
    setSavingKey(s.key);
    await fetch("/api/admin/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s)
    });
    setSavingKey("");
    setSavedKey(s.key);
    setTimeout(() => setSavedKey(""), 1800);
  };

  if (loading) {
    return <div className="animate-pulse p-10 text-center text-sm text-ink-400">Loading…</div>;
  }

  const heroSections = sections.filter((s) => s.key.startsWith("hero_"));
  const featureSections = sections.filter((s) => s.key.startsWith("feature_"));
  const otherSections = sections.filter(
    (s) => !s.key.startsWith("hero_") && !s.key.startsWith("feature_")
  );

  const renderGroup = (group: Section[], title: string) => (
    <section className="rounded-xl border border-ink-200 bg-white shadow-card">
      <div className="border-b border-ink-200 px-5 py-3">
        <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
      </div>
      <div className="divide-y divide-ink-100">
        {group.map((s) => (
          <div key={s.key} className="px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                {prettifyKey(s.key)}
              </p>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                  <input
                    type="checkbox"
                    checked={s.enabled === 1}
                    onChange={(e) => update(s.key, { enabled: e.target.checked ? 1 : 0 })}
                    className="h-3.5 w-3.5 rounded border-ink-300 text-brand-600"
                  />
                  Visible
                </label>
                <button
                  onClick={() => save(s)}
                  disabled={savingKey === s.key}
                  className="inline-flex items-center gap-1 rounded-md bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60"
                >
                  <Save className="h-3 w-3" />
                  {savingKey === s.key ? "Saving…" : savedKey === s.key ? "Saved ✓" : "Save"}
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-3">
              {s.key !== "hero_subtitle" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-500">Title</label>
                  <input
                    className={inputCls}
                    value={s.title}
                    onChange={(e) => update(s.key, { title: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-500">
                  {s.key.startsWith("feature_") ? "Eyebrow (small label)" : "Subtitle / body"}
                </label>
                <textarea
                  className={`${inputCls} min-h-16`}
                  value={s.subtitle}
                  onChange={(e) => update(s.key, { subtitle: e.target.value })}
                />
              </div>
              {s.content !== "" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-500">Content</label>
                  <textarea
                    className={`${inputCls} min-h-16`}
                    value={s.content}
                    onChange={(e) => update(s.key, { content: e.target.value })}
                  />
                </div>
              )}
              {s.badge !== "" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-500">
                    {s.key.startsWith("feature_")
                      ? "Feature icon (icon name)"
                      : "Badge / pill text"}
                  </label>
                  <input
                    className={inputCls}
                    value={s.badge}
                    onChange={(e) => update(s.key, { badge: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Homepage Sections</h1>
      <p className="mt-1 text-sm text-ink-500">
        Every block on the homepage is editable here. Changes go live immediately.
      </p>
      <div className="mt-6 space-y-6">
        {renderGroup(heroSections, "Hero")}
        {renderGroup(featureSections, "Feature Cards (boxes)")}
        {renderGroup(otherSections, "Other sections")}
      </div>
    </div>
  );
}
