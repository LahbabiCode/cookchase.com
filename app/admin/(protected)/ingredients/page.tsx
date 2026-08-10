"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, Plus, Trash2, Scale, Pencil, X, Check } from "lucide-react";

const inputCls =
  "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

interface DensityRow {
  id: number;
  name: string;
  g_per_cup: number;
  note: string;
}

export default function IngredientsAdmin() {
  const [rows, setRows] = useState<DensityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editGPerCup, setEditGPerCup] = useState("");
  const [editNote, setEditNote] = useState("");
  // New-ingredient form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGPerCup, setNewGPerCup] = useState("");
  const [newNote, setNewNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ingredients", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const json = await res.json();
      setRows(Array.isArray(json) ? json : []);
    } catch {
      setError("Could not load ingredients.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3000);
  };

  const startEdit = (row: DensityRow) => {
    setEditingId(row.id);
    setEditName(row.name);
    setEditGPerCup(String(row.g_per_cup));
    setEditNote(row.note);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditGPerCup("");
    setEditNote("");
  };

  const saveEdit = async (id: number) => {
    const gPerCup = parseFloat(editGPerCup);
    if (!editName.trim()) return flash("Name is required.");
    if (!isFinite(gPerCup) || gPerCup <= 0) return flash("Grams per cup must be positive.");
    setError("");
    try {
      const res = await fetch("/api/admin/ingredients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editName.trim(),
          g_per_cup: gPerCup,
          note: editNote.trim()
        })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Update failed.");
        return;
      }
      setRows((rs) =>
        rs.map((r) =>
          r.id === id
            ? { ...r, name: editName.trim(), g_per_cup: gPerCup, note: editNote.trim() }
            : r
        )
      );
      cancelEdit();
      flash("Ingredient saved ✓");
    } catch {
      setError("Update failed.");
    }
  };

  const addIngredient = async () => {
    const gPerCup = parseFloat(newGPerCup);
    if (!newName.trim()) return flash("Name is required.");
    if (!isFinite(gPerCup) || gPerCup <= 0) return flash("Grams per cup must be positive.");
    setError("");
    try {
      const res = await fetch("/api/admin/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          g_per_cup: gPerCup,
          note: newNote.trim()
        })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Add failed.");
        return;
      }
      setRows((rs) => [
        ...rs,
        {
          id: json.id,
          name: newName.trim(),
          g_per_cup: gPerCup,
          note: newNote.trim()
        }
      ]);
      setNewName("");
      setNewGPerCup("");
      setNewNote("");
      setShowAdd(false);
      flash("Ingredient added ✓");
    } catch {
      setError("Add failed.");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this ingredient? Tools will no longer offer it.")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/ingredients?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Delete failed.");
        return;
      }
      setRows((rs) => rs.filter((r) => r.id !== id));
      if (editingId === id) cancelEdit();
      flash("Ingredient deleted");
    } catch {
      setError("Delete failed.");
    }
  };

  const totalGrams = rows.reduce((s, r) => s + r.g_per_cup, 0);
  const avgGrams = rows.length ? Math.round(totalGrams / rows.length) : 0;

  if (loading) {
    return <div className="animate-pulse p-10 text-center text-sm text-ink-400">Loading…</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink-900">
            <Scale className="h-6 w-6 text-brand-600" />
            Ingredient Densities
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            These grams-per-cup values power the Grams ↔ Cups converter and the
            Measurement → Weight tool. Add or edit ingredients here — they appear
            in the tools instantly, no code changes or redeploys needed.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink-500">
          <span>
            <strong className="text-ink-900">{rows.length}</strong> ingredients
          </span>
          <span>
            avg <strong className="text-ink-900">{avgGrams}</strong> g/cup
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          {notice}
        </div>
      )}

      {/* Add form */}
      {showAdd ? (
        <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50/50 p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <Plus className="h-4 w-4 text-brand-600" />
            New ingredient
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_140px_1fr_auto]">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Name</label>
              <input
                className={inputCls}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Chickpea flour"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Grams per cup</label>
              <input
                className={inputCls}
                type="number"
                step="any"
                min="0"
                value={newGPerCup}
                onChange={(e) => setNewGPerCup(e.target.value)}
                placeholder="e.g. 90"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Note (optional)</label>
              <input
                className={inputCls}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g. sifted or as-is"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={addIngredient}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
                Add
              </button>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setNewName("");
                  setNewGPerCup("");
                  setNewNote("");
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Tip: a good starting value is the spoon-and-level weight. E.g. chickpea
            flour ≈ 92 g/cup, peanut flour ≈ 90 g/cup, instant yeast ≈ 150 g/cup.
          </p>
        </div>
      ) : (
        <button
          onClick={() => {
            setShowAdd(true);
            setError("");
          }}
          className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-dashed border-ink-300 bg-white px-4 py-2 text-sm font-medium text-ink-600 transition hover:border-brand-400 hover:text-brand-600"
        >
          <Plus className="h-4 w-4" />
          Add new ingredient
        </button>
      )}

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
        <div className="grid grid-cols-[1fr_120px_1fr_auto] items-center gap-3 border-b border-ink-200 bg-ink-900 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white sm:grid-cols-[1fr_140px_1fr_auto]">
          <span>Ingredient</span>
          <span className="text-right">g / cup</span>
          <span>Note</span>
          <span className="w-24 text-right">Actions</span>
        </div>
        <div className="max-h-[60vh] divide-y divide-ink-100 overflow-y-auto">
          {rows.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-ink-400">
              No ingredients yet — add your first one above.
            </p>
          )}
          {rows.map((row) => {
            const editing = editingId === row.id;
            return (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_120px_1fr_auto] items-center gap-3 px-4 py-2.5 sm:grid-cols-[1fr_140px_1fr_auto]"
              >
                {editing ? (
                  <>
                    <input
                      className={inputCls}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Name"
                    />
                    <input
                      className={`${inputCls} text-right`}
                      type="number"
                      step="any"
                      min="0"
                      value={editGPerCup}
                      onChange={(e) => setEditGPerCup(e.target.value)}
                    />
                    <input
                      className={inputCls}
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="Note (optional)"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => saveEdit(row.id)}
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-md p-1.5 text-ink-400 transition hover:bg-ink-100"
                        aria-label="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-ink-800">{row.name}</span>
                    <span className="text-right text-sm font-bold text-brand-700">
                      {row.g_per_cup}
                    </span>
                    <span className="truncate text-xs text-ink-400">{row.note || "—"}</span>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => startEdit(row)}
                        className="rounded-md p-1.5 text-ink-400 transition hover:bg-brand-50 hover:text-brand-600"
                        aria-label={`Edit ${row.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(row.id)}
                        className="rounded-md p-1.5 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${row.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-xs text-ink-400">
        These densities follow the US standard cup (236.6 ml). Changing a value here
        updates both the Grams ↔ Cups converter and the Measurement → Weight tool on
        their next page load.
      </p>
    </div>
  );
}
