"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, Check, BadgeDollarSign } from "lucide-react";

const inputCls =
  "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

interface PriceRow {
  id: number;
  name: string;
  price_per_kg: number;
  note: string;
}

export default function FoodPricesAdmin() {
  const [rows, setRows] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editNote, setEditNote] = useState("");
  // New-food form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newNote, setNewNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/food-prices", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const json = await res.json();
      setRows(Array.isArray(json) ? json : []);
    } catch {
      setError("Could not load food prices.");
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

  const startEdit = (row: PriceRow) => {
    setEditingId(row.id);
    setEditName(row.name);
    setEditPrice(String(row.price_per_kg));
    setEditNote(row.note);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditPrice("");
    setEditNote("");
  };

  const saveEdit = async (id: number) => {
    const pricePerKg = parseFloat(editPrice);
    if (!editName.trim()) return flash("Name is required.");
    if (!isFinite(pricePerKg) || pricePerKg <= 0) return flash("Price per kg must be positive.");
    setError("");
    try {
      const res = await fetch("/api/admin/food-prices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editName.trim(),
          price_per_kg: pricePerKg,
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
            ? { ...r, name: editName.trim(), price_per_kg: pricePerKg, note: editNote.trim() }
            : r
        )
      );
      cancelEdit();
      flash("Food price saved ✓");
    } catch {
      setError("Update failed.");
    }
  };

  const addFood = async () => {
    const pricePerKg = parseFloat(newPrice);
    if (!newName.trim()) return flash("Name is required.");
    if (!isFinite(pricePerKg) || pricePerKg <= 0) return flash("Price per kg must be positive.");
    setError("");
    try {
      const res = await fetch("/api/admin/food-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          price_per_kg: pricePerKg,
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
          price_per_kg: pricePerKg,
          note: newNote.trim()
        }
      ]);
      setNewName("");
      setNewPrice("");
      setNewNote("");
      setShowAdd(false);
      flash("Food price added ✓");
    } catch {
      setError("Add failed.");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this food price? Cost tools will no longer estimate it.")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/food-prices?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Delete failed.");
        return;
      }
      setRows((rs) => rs.filter((r) => r.id !== id));
      if (editingId === id) cancelEdit();
      flash("Food price deleted");
    } catch {
      setError("Delete failed.");
    }
  };

  const avgPrice =
    rows.length > 0 ? rows.reduce((s, r) => s + r.price_per_kg, 0) / rows.length : 0;

  if (loading) {
    return <div className="animate-pulse p-10 text-center text-sm text-ink-400">Loading…</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink-900">
            <BadgeDollarSign className="h-6 w-6 text-brand-600" />
            Food Price Library
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            Average supermarket prices (USD per kg). When a visitor leaves a price
            blank in the Recipe Cost calculator or the Recipe Comparator, the tool
            estimates the cost from this list automatically. Add or edit foods here —
            they apply instantly, no code changes or redeploys needed.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-ink-500">
          <span>
            <strong className="text-ink-900">{rows.length}</strong> foods
          </span>
          <span>
            avg <strong className="text-ink-900">${avgPrice.toFixed(2)}</strong>/kg
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
            New food price
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_140px_1fr_auto]">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Food name</label>
              <input
                className={inputCls}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Basmati rice"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Price per kg ($)</label>
              <input
                className={inputCls}
                type="number"
                step="any"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="e.g. 3.5"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Note (optional)</label>
              <input
                className={inputCls}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g. organic premium"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={addFood}
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
                  setNewPrice("");
                  setNewNote("");
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Tip: a good starting value is the typical shelf price. E.g. rice ≈ $2.50/kg,
            chicken breast ≈ $7.50/kg, salmon ≈ $22/kg.
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
          Add new food price
        </button>
      )}

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
        <div className="grid grid-cols-[1fr_120px_1fr_auto] items-center gap-3 border-b border-ink-200 bg-ink-900 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-white sm:grid-cols-[1fr_140px_1fr_auto]">
          <span>Food</span>
          <span className="text-right">$/kg</span>
          <span>Note</span>
          <span className="w-24 text-right">Actions</span>
        </div>
        <div className="max-h-[60vh] divide-y divide-ink-100 overflow-y-auto">
          {rows.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-ink-400">
              No food prices yet — add your first one above.
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
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
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
                      ${row.price_per_kg.toFixed(2)}
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
        These are typical US supermarket averages (USD per kg). Changing a value here
        updates the Recipe Cost calculator and the Recipe Comparator on their next page
        load — visitors see the estimate only when they leave the price field blank.
      </p>
    </div>
  );
}
