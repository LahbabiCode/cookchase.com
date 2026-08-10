"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, FileText } from "lucide-react";

interface Page {
  slug: string;
  title: string;
  subtitle: string;
  updated_at: string;
}

export default function PagesAdmin() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/pages")
      .then((r) => r.json())
      .then((data) => {
        setPages(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Pages</h1>
      <p className="mt-1 text-sm text-ink-500">
        Static pages like About, Privacy and Terms — essential for AdSense approval.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
        <div className="grid grid-cols-[1fr_120px_160px] items-center gap-2 border-b border-ink-200 bg-ink-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
          <span>Page</span>
          <span>Slug</span>
          <span className="text-right">Actions</span>
        </div>
        {loading ? (
          <div className="animate-pulse p-8 text-center text-sm text-ink-400">Loading…</div>
        ) : pages.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-400">No pages.</div>
        ) : (
          pages.map((p) => (
            <div
              key={p.slug}
              className="grid grid-cols-[1fr_120px_160px] items-center gap-2 border-b border-ink-100 px-4 py-3 text-sm transition last:border-0 hover:bg-ink-50/50"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 shrink-0 text-ink-300" />
                <div>
                  <p className="font-medium text-ink-900">{p.title}</p>
                  <p className="text-xs text-ink-400">
                    Updated {new Date(p.updated_at + "Z").toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className="text-xs text-ink-500">/{p.slug}</span>
              <div className="flex justify-end">
                <Link
                  href={`/admin/pages/${p.slug}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-600 transition hover:border-brand-300 hover:text-brand-700"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
