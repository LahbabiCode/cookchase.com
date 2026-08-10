"use client";

import { useEffect, useState } from "react";
import { Save, Plus, Trash2, Megaphone } from "lucide-react";

const inputCls =
  "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

interface Ad {
  id: number;
  name: string;
  location: string;
  code: string;
  enabled: number;
  sort_order: number;
}

const LOCATIONS = ["header", "tool_top", "tool_bottom", "home_middle", "footer"];
const LOCATION_LABELS: Record<string, string> = {
  header: "Header banner",
  tool_top: "Tool page — top",
  tool_bottom: "Tool page — bottom",
  home_middle: "Homepage — middle",
  footer: "Footer banner"
};

export default function AdsAdmin() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [adsenseClient, setAdsenseClient] = useState("");
  const [adsenseEnabled, setAdsenseEnabled] = useState(false);
  const [googleVerification, setGoogleVerification] = useState("");
  const [bingVerification, setBingVerification] = useState("");
  const [yandexVerification, setYandexVerification] = useState("");
  const [pinterestVerification, setPinterestVerification] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [adsRes, settingsRes] = await Promise.all([
      fetch("/api/admin/ads").then((r) => r.json()),
      fetch("/api/admin/settings").then((r) => r.json())
    ]);
    setAds(Array.isArray(adsRes) ? adsRes : []);
    setAdsenseClient(settingsRes.adsense_client || "");
    setAdsenseEnabled(settingsRes.adsense_enabled === "1");
    setGoogleVerification(settingsRes.google_verification || "");
    setBingVerification(settingsRes.bing_verification || "");
    setYandexVerification(settingsRes.yandex_verification || "");
    setPinterestVerification(settingsRes.pinterest_verification || "");
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const update = (id: number, patch: Partial<Ad>) =>
    setAds((a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const saveAll = async () => {
    setSaving(true);
    for (const ad of ads) {
      await fetch("/api/admin/ads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ad)
      });
    }
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adsense_client: adsenseClient,
        adsense_enabled: adsenseEnabled ? "1" : "0",
        google_verification: googleVerification,
        bing_verification: bingVerification,
        yandex_verification: yandexVerification,
        pinterest_verification: pinterestVerification
      })
    });
    setSaving(false);
    alert("Ad settings saved ✓");
  };

  const add = async () => {
    const res = await fetch("/api/admin/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New ad", location: "tool_top", code: "", enabled: 0, sort_order: 99 })
    });
    const json = await res.json();
    if (json.ok) {
      setAds((a) => [
        ...a,
        { id: json.id, name: "New ad", location: "tool_top", code: "", enabled: 0, sort_order: 99 }
      ]);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this ad slot?")) return;
    await fetch(`/api/admin/ads?id=${id}`, { method: "DELETE" });
    setAds((a) => a.filter((x) => x.id !== id));
  };

  if (loading) {
    return <div className="animate-pulse p-10 text-center text-sm text-ink-400">Loading…</div>;
  }

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Ad Manager</h1>
          <p className="mt-1 text-sm text-ink-500">
            Paste your ad code or wire up AdSense. Slots are placed in non-intrusive spots.
          </p>
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save all"}
        </button>
      </div>

      {/* AdSense settings */}
      <section className="mt-6 rounded-xl border border-ink-200 bg-white p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Megaphone className="h-4 w-4 text-brand-600" />
          Google AdSense
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          After AdSense approval, paste your publisher ID (e.g.{" "}
          <code className="rounded bg-ink-100 px-1 py-0.5 text-xs">ca-pub-123456789</code>).
          Ad units render automatically in the ad slots below.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">
              AdSense publisher ID
            </label>
            <input
              className={inputCls}
              value={adsenseClient}
              onChange={(e) => setAdsenseClient(e.target.value)}
              placeholder="ca-pub-XXXXXXXXXXXXXXXX"
            />
          </div>
          <label className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              checked={adsenseEnabled}
              onChange={(e) => setAdsenseEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand-600"
            />
            <span className="text-sm font-medium text-ink-700">Enable AdSense ads</span>
          </label>
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-ink-700">
            Google site verification (meta tag)
          </label>
          <input
            className={inputCls}
            value={googleVerification}
            onChange={(e) => setGoogleVerification(e.target.value)}
            placeholder="e.g. google1a2b3c4d5e6f7g8h9i0j"
          />
          <p className="mt-1.5 text-xs text-ink-500">
            Paste the content value Google gives you (Search Console → Settings →
            Verification → HTML tag). It renders as a{" "}
            <code className="rounded bg-ink-100 px-1 py-0.5 text-[11px]">
              google-site-verification
            </code>{" "}
            meta tag on every page. No file upload needed — or use the{" "}
            <code className="rounded bg-ink-100 px-1 py-0.5 text-[11px]">
              /google&lt;code&gt;.html
            </code>{" "}
            file method, which this site already serves automatically.
          </p>
        </div>

        {/* Other search engines — same meta-tag + dynamic file approach as Google */}
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">
              Bing verification
            </label>
            <input
              className={inputCls}
              value={bingVerification}
              onChange={(e) => setBingVerification(e.target.value)}
              placeholder="e.g. 8D2F1A3B..."
            />
            <p className="mt-1.5 text-xs text-ink-500">
              Bing Webmaster → Configure site → meta tag. Renders as{" "}
              <code className="rounded bg-ink-100 px-1 py-0.5 text-[11px]">msvalidate.01</code>,
              and powers the{" "}
              <code className="rounded bg-ink-100 px-1 py-0.5 text-[11px]">/BingSiteAuth.xml</code>{" "}
              file automatically.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">
              Yandex verification
            </label>
            <input
              className={inputCls}
              value={yandexVerification}
              onChange={(e) => setYandexVerification(e.target.value)}
              placeholder="e.g. 4a7b2c8d..."
            />
            <p className="mt-1.5 text-xs text-ink-500">
              Yandex Webmaster → Security → verify. Renders as{" "}
              <code className="rounded bg-ink-100 px-1 py-0.5 text-[11px]">yandex-verification</code>,
              or use the{" "}
              <code className="rounded bg-ink-100 px-1 py-0.5 text-[11px]">/yandex_&lt;code&gt;.html</code>{" "}
              file, served automatically.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">
              Pinterest verification
            </label>
            <input
              className={inputCls}
              value={pinterestVerification}
              onChange={(e) => setPinterestVerification(e.target.value)}
              placeholder="e.g. 5c9e1f2a..."
            />
            <p className="mt-1.5 text-xs text-ink-500">
              Pinterest Business → Claim website → meta tag. Renders as{" "}
              <code className="rounded bg-ink-100 px-1 py-0.5 text-[11px]">p:domain_verify</code>,
              or use the{" "}
              <code className="rounded bg-ink-100 px-1 py-0.5 text-[11px]">/pinterest-&lt;code&gt;.html</code>{" "}
              file, served automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Ad slots */}
      <div className="mt-6 space-y-4">
        {ads.map((ad) => (
          <div key={ad.id} className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <input
                  className={inputCls}
                  style={{ width: 220 }}
                  value={ad.name}
                  onChange={(e) => update(ad.id, { name: e.target.value })}
                />
                <select
                  className={inputCls}
                  style={{ width: 200 }}
                  value={ad.location}
                  onChange={(e) => update(ad.id, { location: e.target.value })}
                >
                  {LOCATIONS.map((l) => (
                    <option key={l} value={l}>
                      {LOCATION_LABELS[l]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                  <input
                    type="checkbox"
                    checked={ad.enabled === 1}
                    onChange={(e) => update(ad.id, { enabled: e.target.checked ? 1 : 0 })}
                    className="h-3.5 w-3.5 rounded border-ink-300 text-brand-600"
                  />
                  Enabled
                </label>
                <button
                  onClick={() => remove(ad.id)}
                  className="rounded-md p-1.5 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete ad slot"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-ink-500">
                Ad code (HTML/ins tag) — or leave empty to use the auto AdSense unit
              </label>
              <textarea
                className={`${inputCls} min-h-16 font-mono text-xs`}
                value={ad.code}
                onChange={(e) => update(ad.id, { code: e.target.value })}
                placeholder="<ins class='adsbygoogle' ...>"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-dashed border-ink-300 bg-white px-4 py-2 text-sm font-medium text-ink-600 transition hover:border-brand-400 hover:text-brand-600"
      >
        <Plus className="h-4 w-4" />
        Add ad slot
      </button>
    </div>
  );
}
