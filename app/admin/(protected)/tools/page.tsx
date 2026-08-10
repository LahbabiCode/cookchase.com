"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import ReportExporter from "@/components/admin/ReportExporter";

interface Tool {
  id: number;
  slug: string;
  name: string;
  category: string;
  icon: string;
  status: string;
  featured: number;
  sort_order: number;
}

export default function ToolsAdmin() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin/tools")
      .then((r) => r.json())
      .then((data) => {
        setTools(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const toggleStatus = async (tool: Tool) => {
    const next = tool.status === "active" ? "hidden" : "active";
    await fetch(`/api/admin/tools/${tool.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    });
    setTools((t) => t.map((x) => (x.id === tool.id ? { ...x, status: next } : x)));
  };

  const filtered = tools.filter((t) => {
    const matchQ =
      !query ||
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.slug.toLowerCase().includes(query.toLowerCase());
    const matchS = !statusFilter || t.status === statusFilter;
    return matchQ && matchS;
  });

  // Distinct categories, for the report export filter dropdown.
  const categories = Array.from(new Set(tools.map((t) => t.category))).sort();

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Tools</h1>
          <p className="mt-1 text-sm text-ink-500">
            Manage your {tools.length} interactive tools — edit content, toggle visibility,
            feature them on the homepage.
          </p>
        </div>
      </div>

      {/* Report export — filter by category or visibility, then download.
          Defaults to active tools (the classic performance report); the admin
          can widen to "All statuses" to export the full inventory. */}
      <div className="mt-6">
        <ReportExporter
          categories={categories}
          statuses={["active", "hidden"]}
          defaultStatus="active"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools…"
            className="w-full rounded-md border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-ink-200 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
        <div className="grid grid-cols-[1fr_130px_100px_110px_110px] items-center gap-2 border-b border-ink-200 bg-ink-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
          <span>Tool</span>
          <span>Category</span>
          <span>Status</span>
          <span>Featured</span>
          <span className="text-right">Actions</span>
        </div>
        {loading ? (
          <div className="animate-pulse p-8 text-center text-sm text-ink-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-400">No tools found.</div>
        ) : (
          filtered.map((tool) => (
            <div
              key={tool.id}
              className="grid grid-cols-[1fr_130px_100px_110px_110px] items-center gap-2 border-b border-ink-100 px-4 py-3 text-sm transition last:border-0 hover:bg-ink-50/50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink-900">{tool.name}</p>
                <p className="truncate text-xs text-ink-400">/{tool.slug}</p>
              </div>
              <span className="text-xs text-ink-600">{tool.category}</span>
              <button
                onClick={() => toggleStatus(tool)}
                className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                  tool.status === "active"
                    ? "bg-green-50 text-green-700 hover:bg-green-100"
                    : "bg-ink-100 text-ink-500 hover:bg-ink-200"
                }`}
              >
                {tool.status === "active" ? "Active" : "Hidden"}
              </button>
              <span
                className={`text-xs font-semibold ${
                  tool.featured === 1 ? "text-amber-600" : "text-ink-300"
                }`}
              >
                {tool.featured === 1 ? "★ Featured" : "—"}
              </span>
              <div className="flex justify-end">
                <Link
                  href={`/admin/tools/${tool.id}/edit`}
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

      <div className="mt-5 rounded-lg border border-dashed border-ink-300 bg-white p-4">
        <p className="text-sm text-ink-500">
          Building a new tool? Add it here and it becomes a live page under{" "}
          <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">/tools/your-slug</code>.
        </p>
        <a
          href="/admin/tools/new/edit"
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-800"
        >
          <Plus className="h-4 w-4" />
          Add new tool
        </a>
      </div>
    </div>
  );
}
