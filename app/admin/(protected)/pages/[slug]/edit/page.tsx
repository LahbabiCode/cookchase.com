"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Save, Eye } from "lucide-react";

const inputCls =
  "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

interface PageData {
  slug: string;
  title: string;
  subtitle: string;
  content: string;
  meta_title: string;
  meta_description: string;
}

export default function PageEditor() {
  const params = useParams<{ slug: string }>();
  const [data, setData] = useState<PageData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/pages/${params.slug}`)
      .then((r) => r.json())
      .then((d) => setData(d));
  }, [params.slug]);

  const set = (patch: Partial<PageData>) => setData((d) => (d ? { ...d, ...patch } : d));

  const save = async () => {
    if (!data) return;
    setSaving(true);
    await fetch(`/api/admin/pages/${data.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!data) {
    return <div className="animate-pulse p-10 text-center text-sm text-ink-400">Loading…</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link
          href="/admin/pages"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to pages
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={`/${data.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50"
          >
            <Eye className="h-4 w-4" />
            View page
          </a>
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
        Edit page: {data.slug}
      </h1>

      <div className="mt-6 space-y-6">
        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Content
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Title</label>
              <input className={inputCls} value={data.title} onChange={(e) => set({ title: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Subtitle</label>
              <input className={inputCls} value={data.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Body content{" "}
                <span className="font-normal text-ink-400">
                  (supports markdown: ## headings, **bold**, lists, tables, ```code```)
                </span>
              </label>
              <textarea
                className={`${inputCls} min-h-96 font-mono text-xs leading-relaxed`}
                value={data.content}
                onChange={(e) => set({ content: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">SEO</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Meta title</label>
              <input className={inputCls} value={data.meta_title} onChange={(e) => set({ meta_title: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Meta description</label>
              <textarea
                className={`${inputCls} min-h-20`}
                value={data.meta_description}
                onChange={(e) => set({ meta_description: e.target.value })}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
