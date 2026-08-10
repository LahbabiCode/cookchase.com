"use client";

import { useEffect, useState } from "react";
import { Save, Plus, Trash2, Newspaper } from "lucide-react";
import FieldHint from "@/components/admin/FieldHint";
import ArticleLivePreview from "@/components/admin/ArticleLivePreview";

const inputCls =
  "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  meta_title: string;
  meta_description: string;
  published: number;
  created_at?: string;
}

export default function ArticlesAdmin() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const load = () =>
    fetch("/api/admin/articles")
      .then((r) => r.json())
      .then((data) => {
        setArticles(Array.isArray(data) ? data : []);
        setLoading(false);
      });

  useEffect(() => {
    load();
  }, []);

  const newArticle = () => {
    setEditing({
      id: 0,
      slug: "",
      title: "",
      excerpt: "",
      content: "",
      category: "Tips",
      meta_title: "",
      meta_description: "",
      published: 1
    });
  };

  const set = (patch: Partial<Article>) =>
    setEditing((d) => (d ? { ...d, ...patch } : d));

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setNotice("");
    try {
      if (editing.id === 0) {
        const res = await fetch("/api/admin/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editing)
        });
        const json = await res.json();
        if (!res.ok) {
          setNotice(`Error: ${json.error || "failed to create"}`);
          setSaving(false);
          return;
        }
      } else {
        const res = await fetch(`/api/admin/articles/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editing)
        });
        if (!res.ok) {
          setNotice("Error: failed to save");
          setSaving(false);
          return;
        }
      }
      setNotice("Saved ✓");
      setEditing(null);
      await load();
    } catch {
      setNotice("Error: something went wrong");
    }
    setSaving(false);
  };

  const remove = async (a: Article) => {
    if (!confirm(`Delete "${a.title}"?`)) return;
    await fetch(`/api/admin/articles/${a.id}`, { method: "DELETE" });
    await load();
  };

  if (editing) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            {editing.id === 0 ? "New article" : `Edit: ${editing.title}`}
          </h1>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        {notice && <p className="mt-3 text-sm text-ink-500">{notice}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            {/* Article details */}
            <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                Article details
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Title
                  </label>
                  <input
                    className={inputCls}
                    value={editing.title}
                    onChange={(e) => set({ title: e.target.value })}
                    placeholder="How to Scale Any Recipe Up or Down"
                  />
                  <FieldHint>
                    The headline visitors read and Google shows. Make it specific
                    and useful, e.g. “How to Scale Any Recipe Up or Down”.
                  </FieldHint>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Slug (URL)
                  </label>
                  <input
                    className={inputCls}
                    value={editing.slug}
                    onChange={(e) =>
                      set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })
                    }
                    placeholder="scale-any-recipe"
                  />
                  <p className="mt-1.5 text-xs text-ink-400">
                    Page lives at /blog/{editing.slug || "…"}
                  </p>
                  <FieldHint>
                    Lowercase letters, numbers and dashes only. This becomes the
                    web address, so choose it once — changing it later breaks
                    old links. Required for new articles.
                  </FieldHint>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Category
                  </label>
                  <input
                    className={inputCls}
                    value={editing.category}
                    onChange={(e) => set({ category: e.target.value })}
                    placeholder="Tips"
                  />
                  <FieldHint>
                    Groups related articles on the blog. Reuse an existing name
                    like Tips, Guides or Recipes so posts appear together.
                  </FieldHint>
                </div>
                <label className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    checked={editing.published === 1}
                    onChange={(e) => set({ published: e.target.checked ? 1 : 0 })}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600"
                  />
                  <span className="text-sm font-medium text-ink-700">
                    Published (visible on blog)
                  </span>
                </label>
                <div className="sm:col-span-2">
                  <FieldHint>
                    Published articles appear on the blog right away. Leave
                    unchecked to save a draft while you&apos;re still writing.
                  </FieldHint>
                </div>
              </div>
            </section>

            {/* Content */}
            <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                Content
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Excerpt
                  </label>
                  <textarea
                    className={`${inputCls} min-h-16`}
                    value={editing.excerpt}
                    onChange={(e) => set({ excerpt: e.target.value })}
                  />
                  <FieldHint>
                    The short summary shown under the title on the article page
                    and in Google results. Two or three sentences that make
                    visitors want to read on.
                  </FieldHint>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Content{" "}
                    <span className="font-normal text-ink-400">
                      (markdown supported)
                    </span>
                  </label>
                  <textarea
                    className={`${inputCls} min-h-96 font-mono text-xs leading-relaxed`}
                    value={editing.content}
                    onChange={(e) => set({ content: e.target.value })}
                  />
                  <FieldHint>
                    The article itself, written in markdown. # for headings, -
                    for lists, **bold**, [links](url). Leave a blank line between
                    paragraphs. Start with a friendly opening — readers are home
                    cooks, not developers.
                  </FieldHint>
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
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Meta title
                  </label>
                  <input
                    className={inputCls}
                    value={editing.meta_title}
                    onChange={(e) => set({ meta_title: e.target.value })}
                  />
                  <p className="mt-1.5 text-xs text-ink-400">
                    {editing.meta_title.length}/60 characters recommended
                  </p>
                  <FieldHint>
                    The headline Google shows in search results. Aim for 50–60
                    characters and include the topic, e.g. “How to Scale Any
                    Recipe Up or Down — CookChase”.
                  </FieldHint>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-700">
                    Meta description
                  </label>
                  <textarea
                    className={`${inputCls} min-h-20`}
                    value={editing.meta_description}
                    onChange={(e) => set({ meta_description: e.target.value })}
                  />
                  <p className="mt-1.5 text-xs text-ink-400">
                    {editing.meta_description.length}/160 characters recommended
                  </p>
                  <FieldHint>
                    The short description under the title in Google results. In
                    150–160 characters, say what the article teaches and why
                    it&apos;s useful.
                  </FieldHint>
                </div>
              </div>
            </section>
          </div>

          {/* Live preview column */}
          <aside className="min-w-0">
            <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
              <ArticleLivePreview article={editing} />
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Articles</h1>
          <p className="mt-1 text-sm text-ink-500">
            Write guides and recipes to keep the site fresh — great for SEO and AdSense.
          </p>
        </div>
        <button
          onClick={newArticle}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          <Plus className="h-4 w-4" />
          New article
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
        <div className="grid grid-cols-[1fr_120px_140px_120px] items-center gap-2 border-b border-ink-200 bg-ink-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
          <span>Article</span>
          <span>Category</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        {loading ? (
          <div className="animate-pulse p-8 text-center text-sm text-ink-400">Loading…</div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-400">No articles yet.</div>
        ) : (
          articles.map((a) => (
            <div
              key={a.id}
              className="grid grid-cols-[1fr_120px_140px_120px] items-center gap-2 border-b border-ink-100 px-4 py-3 text-sm transition last:border-0 hover:bg-ink-50/50"
            >
              <div className="flex items-center gap-3">
                <Newspaper className="h-4 w-4 shrink-0 text-ink-300" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900">{a.title}</p>
                  <p className="truncate text-xs text-ink-400">/{a.slug}</p>
                </div>
              </div>
              <span className="text-xs text-ink-600">{a.category}</span>
              <span
                className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  a.published === 1 ? "bg-green-50 text-green-700" : "bg-ink-100 text-ink-500"
                }`}
              >
                {a.published === 1 ? "Published" : "Draft"}
              </span>
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setEditing(a)}
                  className="rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(a)}
                  className="rounded-md border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-400 transition hover:border-red-200 hover:text-red-600"
                  aria-label="Delete article"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
