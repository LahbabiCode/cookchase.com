"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import {
  Field,
  NumberInput,
  selectCls,
  AddRowButton,
  RemoveButton,
  ExampleHelper,
  useNumber,
  fmt
} from "./ui";
import { usePublishToolFacts } from "./faqStore";
import { FOODS } from "./foodData";
import { useFoodPrices } from "./useFoodPrices";
import { estimateCost, findPricePerKg } from "./foodPrices";
import {
  ArrowLeftRight,
  Clock,
  DollarSign,
  Scale,
  Trophy,
  Download,
  FileText,
  Loader2,
  Share2,
  Check,
  Link2
} from "lucide-react";
import {
  encodeComparison,
  decodeComparison,
  buildShareUrl,
  buildSocialLinks
} from "@/lib/comparison-share";

interface Ing {
  food: string;
  grams: string;
  price: string;
  packageSize: string;
}

interface Recipe {
  name: string;
  servings: string;
  prep: string;
  cook: string;
  ingredients: Ing[];
}

const chickenRecipe = (): Recipe => ({
  name: "Garlic chicken & rice",
  servings: "4",
  prep: "15",
  cook: "30",
  ingredients: [
    { food: "Chicken breast (raw)", grams: "600", price: "5", packageSize: "600" },
    { food: "White rice (dry)", grams: "200", price: "2.4", packageSize: "1000" },
    { food: "Broccoli", grams: "300", price: "1.8", packageSize: "500" },
    { food: "Olive oil", grams: "15", price: "9", packageSize: "750" }
  ]
});

const tacoRecipe = (): Recipe => ({
  name: "Beef tacos",
  servings: "4",
  prep: "10",
  cook: "15",
  ingredients: [
    { food: "Beef mince (10% fat)", grams: "500", price: "6", packageSize: "500" },
    { food: "Flour tortilla", grams: "300", price: "2.5", packageSize: "500" },
    { food: "Cheddar cheese", grams: "100", price: "3", packageSize: "200" },
    { food: "Avocado", grams: "150", price: "1.5", packageSize: "200" }
  ]
});

const veggieRecipe = (): Recipe => ({
  name: "Veggie stir-fry",
  servings: "4",
  prep: "20",
  cook: "15",
  ingredients: [
    { food: "Tofu (firm)", grams: "400", price: "1.6", packageSize: "400" },
    { food: "White rice (dry)", grams: "200", price: "2.4", packageSize: "1000" },
    { food: "Broccoli", grams: "250", price: "1.8", packageSize: "500" },
    { food: "Bell pepper", grams: "150", price: "1.2", packageSize: "500" },
    { food: "Soy sauce", grams: "20", price: "1", packageSize: "500" }
  ]
});

function computeRecipe(r: Recipe, priceMap: Record<string, number>) {
  const servings = useNumber(r.servings);
  const prep = useNumber(r.prep);
  const cook = useNumber(r.cook);
  let cost = 0;
  let estimatedCount = 0;
  const nut = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const ing of r.ingredients) {
    const grams = useNumber(ing.grams);
    const pkg = useNumber(ing.packageSize);
    const price = useNumber(ing.price);
    if (pkg > 0 && price > 0) {
      cost += (grams / pkg) * price;
    } else {
      // Blank price → estimate from the average supermarket rate.
      const est = estimateCost(grams, findPricePerKg(ing.food, priceMap));
      cost += est;
      if (est > 0) estimatedCount++;
    }
    const n = FOODS[ing.food];
    if (n) {
      const f = grams / 100;
      nut.kcal += n.kcal * f;
      nut.protein += n.protein * f;
      nut.carbs += n.carbs * f;
      nut.fat += n.fat * f;
      nut.fiber += n.fiber * f;
    }
  }
  const perServing = servings > 0 ? cost / servings : 0;
  const per = {
    kcal: servings > 0 ? nut.kcal / servings : 0,
    protein: servings > 0 ? nut.protein / servings : 0,
    carbs: servings > 0 ? nut.carbs / servings : 0,
    fat: servings > 0 ? nut.fat / servings : 0,
    fiber: servings > 0 ? nut.fiber / servings : 0
  };
  return {
    servings,
    prep,
    cook,
    totalTime: prep + cook,
    cost,
    perServing,
    per,
    estimatedCount
  };
}

type Cal = ReturnType<typeof computeRecipe>;
type Accent = "brand" | "amber" | "emerald";

const ACCENT_STYLES: Record<
  Accent,
  { ring: string; badge: string; bar: string; dot: string; text: string }
> = {
  brand: {
    ring: "border-brand-200",
    badge: "bg-brand-600",
    bar: "bg-brand-500",
    dot: "bg-brand-500",
    text: "text-brand-600"
  },
  amber: {
    ring: "border-amber-200",
    badge: "bg-amber-500",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    text: "text-amber-600"
  },
  emerald: {
    ring: "border-emerald-200",
    badge: "bg-emerald-500",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    text: "text-emerald-600"
  }
};

interface PanelProps {
  label: string;
  recipe: Recipe;
  cal: Cal;
  accent: Accent;
  onChange: (patch: Partial<Recipe>) => void;
  onIngredientChange: (i: number, patch: Partial<Ing>) => void;
  onIngredientRemove: (i: number) => void;
  onAddIngredient: () => void;
  priceMap: Record<string, number>;
}

function RecipePanel({
  label,
  recipe,
  cal,
  accent,
  onChange,
  onIngredientChange,
  onIngredientRemove,
  onAddIngredient,
  priceMap
}: PanelProps) {
  const styles = ACCENT_STYLES[accent];
  return (
    <div className={`flex flex-col rounded-xl border ${styles.ring} bg-white p-4 shadow-card`}>
      <div className="flex items-center justify-between">
        <span className={`rounded-full ${styles.badge} px-2.5 py-0.5 text-[11px] font-bold text-white`}>
          {label}
        </span>
        <input
          className="w-40 rounded-md border border-transparent bg-transparent px-2 py-1 text-right text-sm font-bold text-ink-900 outline-none transition hover:border-ink-200 focus:border-brand-400 focus:bg-white"
          value={recipe.name}
          placeholder="Recipe name"
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Field label="Servings">
          <NumberInput value={recipe.servings} onChange={(v) => onChange({ servings: v })} min={1} />
        </Field>
        <Field label="Prep (min)">
          <NumberInput value={recipe.prep} onChange={(v) => onChange({ prep: v })} min={0} />
        </Field>
        <Field label="Cook (min)">
          <NumberInput value={recipe.cook} onChange={(v) => onChange({ cook: v })} min={0} />
        </Field>
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">
        Ingredients — amount · price · package size
      </p>
      <div className="mt-1.5 overflow-hidden rounded-lg border border-ink-200">
        <div className="grid grid-cols-[1.1fr_64px_70px_70px_auto] items-center gap-1.5 bg-ink-50 px-1.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
          <span>Food</span>
          <span>g</span>
          <span>$</span>
          <span>size</span>
          <span />
        </div>
        {recipe.ingredients.map((ing, i) => (
          <IngredientRows
            key={i}
            ing={ing}
            priceMap={priceMap}
            onChange={(patch) => onIngredientChange(i, patch)}
            onRemove={() => onIngredientRemove(i)}
          />
        ))}
        <div className="p-1.5">
          <AddRowButton onClick={onAddIngredient}>Add ingredient</AddRowButton>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-ink-50 p-3 text-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Total time</p>
          <p className="text-sm font-bold text-ink-900">{cal.totalTime} min</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Total cost</p>
          <p className="text-sm font-bold text-ink-900">${fmt(cal.cost, 2)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">Per serving</p>
          <p className="text-sm font-bold text-ink-900">${fmt(cal.perServing, 2)}</p>
        </div>
      </div>
      {cal.estimatedCount > 0 && (
        <p className="mt-2 rounded-md bg-copper-500/10 px-2.5 py-1.5 text-[11px] text-copper-700">
          {cal.estimatedCount} ingredient price{cal.estimatedCount > 1 ? "s" : ""} estimated
          from average supermarket rates.
        </p>
      )}
    </div>
  );
}

function IngredientRows({
  ing,
  priceMap,
  onChange,
  onRemove
}: {
  ing: Ing;
  priceMap: Record<string, number>;
  onChange: (patch: Partial<Ing>) => void;
  onRemove: () => void;
}) {
  const price = useNumber(ing.price);
  const pkg = useNumber(ing.packageSize);
  const estimated = !(pkg > 0 && price > 0) && (findPricePerKg(ing.food, priceMap) ?? 0) > 0;
  return (
    <div className="grid grid-cols-[1.1fr_64px_70px_70px_auto] items-center gap-1.5 border-b border-ink-100 p-1.5 last:border-0 sm:grid-cols-[1.1fr_64px_70px_70px_auto]">
      <select
        className={`${selectCls} px-2 py-1.5 text-xs`}
        value={ing.food}
        onChange={(e) => onChange({ food: e.target.value })}
      >
        {Object.keys(FOODS).map((f) => (
          <option key={f}>{f}</option>
        ))}
      </select>
      <NumberInput value={ing.grams} onChange={(v) => onChange({ grams: v })} placeholder="g" />
      <div className="relative">
        <NumberInput value={ing.price} onChange={(v) => onChange({ price: v })} placeholder="auto" />
        {estimated && (
          <span
            title={`Estimated from the average supermarket price for ${ing.food}`}
            className="absolute -right-1 -top-1 rounded-full bg-copper-500 px-1.5 py-0.5 text-[9px] font-bold text-white"
          >
            est.
          </span>
        )}
      </div>
      <NumberInput
        value={ing.packageSize}
        onChange={(v) => onChange({ packageSize: v })}
        placeholder="size"
      />
      <RemoveButton onRemove={onRemove} />
    </div>
  );
}

// ---- Metric model --------------------------------------------------------------
// Each metric computes raw values for the three recipes and a "better" direction.
// Winner = best raw value (respecting direction), ties are neutral.

type MetricKey =
  | "totalTime"
  | "perServing"
  | "servings"
  | "kcal"
  | "protein"
  | "carbs"
  | "fat"
  | "fiber";

const METRIC_DEFS: {
  key: MetricKey;
  label: string;
  tip: string;
  better: "lower" | "higher" | "note";
  valueOf: (c: Cal) => number;
  format: (n: number) => string;
}[] = [
  {
    key: "totalTime",
    label: "Total time",
    tip: "prep + cook",
    better: "lower",
    valueOf: (c) => c.totalTime,
    format: (n) => `${fmt(n, 0)} min`
  },
  {
    key: "perServing",
    label: "Cost per serving",
    tip: "ingredients ÷ servings",
    better: "lower",
    valueOf: (c) => c.perServing,
    format: (n) => `$${fmt(n, 2)}`
  },
  {
    key: "servings",
    label: "Servings",
    tip: "just a note — more isn't always better",
    better: "note",
    valueOf: (c) => c.servings,
    format: (n) => fmt(n, 0)
  },
  {
    key: "kcal",
    label: "Calories / serving",
    tip: "lower is lighter",
    better: "lower",
    valueOf: (c) => c.per.kcal,
    format: (n) => `${fmt(n, 0)} kcal`
  },
  {
    key: "protein",
    label: "Protein / serving",
    tip: "higher is better",
    better: "higher",
    valueOf: (c) => c.per.protein,
    format: (n) => `${fmt(n, 1)} g`
  },
  {
    key: "carbs",
    label: "Carbs / serving",
    tip: "context matters (training vs. low-carb)",
    better: "note",
    valueOf: (c) => c.per.carbs,
    format: (n) => `${fmt(n, 1)} g`
  },
  {
    key: "fat",
    label: "Fat / serving",
    tip: "lower is lighter",
    better: "lower",
    valueOf: (c) => c.per.fat,
    format: (n) => `${fmt(n, 1)} g`
  },
  {
    key: "fiber",
    label: "Fiber / serving",
    tip: "higher is better",
    better: "higher",
    valueOf: (c) => c.per.fiber,
    format: (n) => `${fmt(n, 1)} g`
  }
];

interface MetricRow {
  key: MetricKey;
  label: string;
  tip: string;
  values: string[];
  pcts: number[]; // 0..100 bar widths (best recipe = 100)
  win: number | null; // index of winner, null for ties/notes
}

/**
 * Compute metric rows with normalized bar widths. For "lower is better" the
 * smallest value becomes 100%; for "higher is better" the largest does. Note
 * rows (servings/carbs) get a neutral share of the max so bars stay visual.
 */
function buildMetrics(calcs: Cal[]): MetricRow[] {
  const eps = 0.01;
  return METRIC_DEFS.map((def) => {
    const raw = calcs.map(def.valueOf);
    const formatted = raw.map(def.format);

    let win: number | null = null;
    if (def.better === "lower") {
      const min = Math.min(...raw);
      // Only a sole leader wins — if two recipes are within eps of the best
      // value, they're effectively tied and nobody gets the crown.
      const leaders = raw.filter((v) => Math.abs(v - min) < eps).length;
      win = leaders === 1 ? raw.indexOf(min) : null;
    } else if (def.better === "higher") {
      const max = Math.max(...raw);
      const leaders = raw.filter((v) => Math.abs(v - max) < eps).length;
      win = leaders === 1 ? raw.indexOf(max) : null;
    }

    // Bars: best → 100%. For "lower", invert so the smallest value fills the bar.
    let pcts: number[];
    if (def.better === "note") {
      const max = Math.max(...raw, 1);
      pcts = raw.map((v) => (max > 0 ? Math.round((v / max) * 100) : 0));
    } else if (def.better === "lower") {
      const min = Math.min(...raw);
      const max = Math.max(...raw);
      pcts = raw.map((v) =>
        max === min ? 100 : Math.round(((max - v) / (max - min)) * 100)
      );
    } else {
      const min = Math.min(...raw);
      const max = Math.max(...raw);
      pcts = raw.map((v) =>
        max === min ? 100 : Math.round(((v - min) / (max - min)) * 100)
      );
    }

    return {
      key: def.key,
      label: def.label,
      tip: def.tip,
      values: formatted,
      pcts,
      win
    };
  });
}

// ---- Clipboard -------------------------------------------------------------------

/** Copy text to the clipboard, falling back to execCommand on non-secure contexts. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

// ---- Pro PDF export --------------------------------------------------------------

async function downloadPdf(data: {
  siteName: string;
  generatedAt: string;
  recipes: {
    label: string;
    name: string;
    servings: number;
    totalTime: number;
    cost: number;
    perServing: number;
    per: Cal["per"];
    estimatedCount: number;
  }[];
  metrics: { label: string; tip: string; values: string[]; win: number | null }[];
  summary: string;
}) {
  const res = await fetch("/api/tools/recipe-comparator/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data })
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || "Could not export the PDF.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "recipe-comparison.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer the revoke so the browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- Widget -------------------------------------------------------------------------

const LABELS = ["Recipe A", "Recipe B", "Recipe C"];
const ACCENTS: Accent[] = ["brand", "amber", "emerald"];
const LETTERS = ["A", "B", "C"];

export default function RecipeComparatorWidget() {
  const { priceMap } = useFoodPrices();
  const [recipes, setRecipes] = useState<Recipe[]>([
    chickenRecipe(),
    tacoRecipe(),
    veggieRecipe()
  ]);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [copied, setCopied] = useState(false);

  // Restore a comparison shared via ?cmp= — only on first mount, so the
  // visitor's own edits never get clobbered by a re-render.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const params = new URLSearchParams(window.location.search);
    const shared = decodeComparison(params.get("cmp"));
    if (shared && shared.length >= 1) {
      setRecipes(shared);
      // Drop only the cmp param so the address bar doesn't go stale as the
      // visitor edits — other params (e.g. UTM tags) are preserved.
      params.delete("cmp");
      const qs = params.toString();
      window.history.replaceState({}, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    }
  }, []);

  // Live share URL — always reflects the current comparison state.
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const enc = encodeComparison(recipes);
    return buildShareUrl(window.location.origin + window.location.pathname, enc);
  }, [recipes]);

  const socials = useMemo(() => (shareUrl ? buildSocialLinks(shareUrl) : null), [shareUrl]);

  const handleCopyShare = async () => {
    if (typeof window === "undefined" || !shareUrl) return;
    const ok = await copyText(shareUrl);
    // Reflect the current state in the address bar so the copied link is real.
    // Rebuild the query string rather than replacing it wholesale, so other
    // params (e.g. UTM tags) survive.
    const params = new URLSearchParams(window.location.search);
    params.set("cmp", encodeComparison(recipes));
    const qs = params.toString();
    window.history.replaceState({}, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const loadExample = () => {
    setRecipes([chickenRecipe(), tacoRecipe(), veggieRecipe()]);
  };

  const updateRecipe = (i: number, patch: Partial<Recipe>) => {
    setRecipes((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const updateIng = (i: number, j: number, patch: Partial<Ing>) => {
    setRecipes((rs) =>
      rs.map((r, idx) =>
        idx === i
          ? { ...r, ingredients: r.ingredients.map((row, jdx) => (jdx === j ? { ...row, ...patch } : row)) }
          : r
      )
    );
  };

  const removeIng = (i: number, j: number) => {
    setRecipes((rs) =>
      rs.map((r, idx) =>
        idx === i ? { ...r, ingredients: r.ingredients.filter((_, jdx) => jdx !== j) } : r
      )
    );
  };

  const addIng = (i: number) => {
    setRecipes((rs) =>
      rs.map((r, idx) =>
        idx === i
          ? { ...r, ingredients: [...r.ingredients, { food: "Egg (large)", grams: "100", price: "1", packageSize: "100" }] }
          : r
      )
    );
  };

  const calcs = useMemo(
    () => recipes.map((r) => computeRecipe(r, priceMap)),
    [recipes, priceMap]
  );
  const metrics = useMemo(() => buildMetrics(calcs), [calcs]);

  // Win tally per recipe across all metrics with a decided winner.
  const wins = useMemo(() => {
    const tally = [0, 0, 0];
    for (const m of metrics) {
      if (m.win !== null) tally[m.win]++;
    }
    return tally;
  }, [metrics]);

  const maxWins = Math.max(...wins);
  const summary =
    wins.every((w) => w === 0) || maxWins === 0
      ? "It's a tie — flip a coin, or pick the one you're craving."
      : wins.filter((w) => w === maxWins).length > 1
        ? `It's a tie at ${maxWins} categories each — close call!`
        : `${recipes[wins.indexOf(maxWins)].name || LABELS[wins.indexOf(maxWins)]} wins ${maxWins} categories.`;

  const cheapestIdx = calcs.reduce(
    (best, c, i) => (c.perServing < calcs[best].perServing ? i : best),
    0
  );
  const fastestIdx = calcs.reduce(
    (best, c, i) => (c.totalTime < calcs[best].totalTime ? i : best),
    0
  );
  const cheapestName = recipes[cheapestIdx]?.name || LABELS[cheapestIdx];
  const fastestName = recipes[fastestIdx]?.name || LABELS[fastestIdx];

  usePublishToolFacts("recipe-comparator", {
    count: { label: "Recipes compared", value: String(recipes.length) },
    summary: { label: "Winner", value: summary },
    cheapest: { label: "Cheapest", value: cheapestName },
    fastest: { label: "Fastest", value: fastestName }
  });

  const handleExport = async () => {
    setExportError("");
    setExporting(true);
    try {
      await downloadPdf({
        siteName: "CookChase",
        generatedAt: new Date().toISOString(),
        recipes: recipes.map((r, i) => ({
          label: LETTERS[i],
          name: r.name || LABELS[i],
          servings: calcs[i].servings,
          totalTime: calcs[i].totalTime,
          cost: calcs[i].cost,
          perServing: calcs[i].perServing,
          per: calcs[i].per,
          estimatedCount: calcs[i].estimatedCount
        })),
        metrics: metrics.map((m) => ({
          label: m.label,
          tip: m.tip,
          values: m.values,
          win: m.win
        })),
        summary
      });
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Could not export the PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ExampleHelper
        hint="Compare a garlic chicken & rice dinner, beef tacos and a veggie stir-fry — time, cost & nutrition."
        onExample={loadExample}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {recipes.map((r, i) => (
          <RecipePanel
            key={i}
            label={LABELS[i]}
            recipe={r}
            cal={calcs[i]}
            accent={ACCENTS[i]}
            onChange={(patch) => updateRecipe(i, patch)}
            onIngredientChange={(j, patch) => updateIng(i, j, patch)}
            onIngredientRemove={(j) => removeIng(i, j)}
            onAddIngredient={() => addIng(i)}
            priceMap={priceMap}
          />
        ))}
      </div>

      {/* Comparison table with progress bars */}
      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 bg-ink-900 px-4 py-3 text-white">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <ArrowLeftRight className="h-4 w-4 text-brand-300" />
            Side-by-side comparison
          </h3>
          <span className="text-xs font-medium text-ink-300">
            {recipes.map((r, i) => `${LABELS[i]}${r.name ? ` · ${r.name}` : ""}`).join("  |  ")}
          </span>
        </div>
        <div>
          {metrics.map((m) => {
            const winnerAccent = m.win !== null ? ACCENTS[m.win] : null;
            return (
              <div
                key={m.key}
                className="border-b border-ink-100 px-4 py-3.5 last:border-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-bold text-ink-900">{m.label}</p>
                  <p className="text-[11px] text-ink-400">{m.tip}</p>
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-3">
                  {recipes.map((r, i) => {
                    const styles = ACCENT_STYLES[ACCENTS[i]];
                    const isWinner = m.win === i;
                    return (
                      <div key={i} className="min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span
                              className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`}
                              aria-hidden="true"
                            />
                            <span
                              className={`truncate text-[11px] font-medium ${
                                isWinner ? styles.text : "text-ink-500"
                              }`}
                              title={r.name || LABELS[i]}
                            >
                              {LABELS[i]}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 text-xs font-bold ${
                              isWinner ? styles.text : "text-ink-800"
                            }`}
                          >
                            {m.values[i]}
                          </span>
                        </div>
                        {/* Progress bar — the best recipe fills the bar */}
                        <div
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={m.pcts[i]}
                          aria-label={`${m.label} — ${LABELS[i]}`}
                          className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100"
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${styles.bar} ${
                              isWinner ? "opacity-100" : "opacity-55"
                            }`}
                            style={{ width: `${m.pcts[i]}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {m.win !== null && (
                  <p
                    className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold ${
                      ACCENT_STYLES[ACCENTS[m.win]].text
                    }`}
                  >
                    <Trophy className="h-3 w-3" />
                    {LABELS[m.win]}
                    {recipes[m.win].name ? ` (${recipes[m.win].name})` : ""} wins this metric
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 bg-ink-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-ink-600">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>{summary}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-400">
            <Clock className="h-3.5 w-3.5" />
            <DollarSign className="h-3.5 w-3.5" />
            <Scale className="h-3.5 w-3.5" />
            Time, cost & nutrition compared
          </div>
        </div>
      </div>

      {/* PDF export — free for everyone */}
      <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">Export as PDF</p>
              <p className="mt-0.5 text-xs text-ink-500">
                Download this three-way comparison — recipes, costs, nutrition and winners — as a
                clean, printable PDF.
              </p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? "Generating PDF…" : "Download PDF"}
          </button>
        </div>
        {exportError && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {exportError}
          </p>
        )}
      </div>

      {/* Share this comparison */}
      <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <Share2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">Share this comparison</p>
              <p className="mt-0.5 text-xs text-ink-500">
                Copy a link that re-opens this exact three-way comparison — anyone who opens it
                sees the same recipes, costs and winners.
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyShare}
            aria-live="polite"
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition ${
              copied ? "bg-green-600 hover:bg-green-700" : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            {copied ? "Link copied!" : "Copy link"}
          </button>
        </div>
        {socials && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3.5">
            <span className="text-xs font-medium text-ink-400">Share on:</span>
            <a
              href={socials.x}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-ink-900 hover:bg-ink-900 hover:text-white"
            >
              X (Twitter)
            </a>
            <a
              href={socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white"
            >
              Facebook
            </a>
            <a
              href={socials.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:border-[#25D366] hover:bg-[#25D366] hover:text-white"
            >
              WhatsApp
            </a>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-ink-200 bg-white p-4 text-xs leading-relaxed text-ink-500">
        <strong className="text-ink-700">How it works:</strong> each panel is a full mini-recipe.
        Add up to three recipes with their amount (grams), the price you paid, and the package size
        (grams) — the cost per ingredient is price ÷ package size × amount. Leave a price blank
        to estimate it from average supermarket rates (editable in the admin panel). Nutrition uses
        USDA-style averages per 100 g of raw food. Totals are divided by servings, and the
        comparison fills a progress bar to 100% for the best recipe in each row. Ties are left
        neutral, and carbs/servings are shown as notes rather than "winners" because context
        matters more than a number.
      </div>
    </div>
  );
}
