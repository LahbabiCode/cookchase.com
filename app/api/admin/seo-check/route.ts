import { NextRequest, NextResponse } from "next/server";
import { getSetting, getSiteUrl } from "@/lib/queries";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

interface CheckResult {
  id: string;
  label: string;
  purpose: string;
  path: string;
  url: string;
  expected: string;
  status: number;
  ms: number;
  state: "ok" | "warn" | "fail";
  note: string;
  contentCheck?: string;
}

async function probe(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "CookChase-SEO-Checker/1.0" }
    });
    let body = "";
    try {
      // Cap at 100k chars — sitemap/robots/ads.txt are tiny, this guards
      // against anything unexpectedly huge while still counting every <url>.
      body = (await res.text()).slice(0, 100_000);
    } catch {
      /* body not text — fine */
    }
    return { status: res.status, ms: Date.now() - start, body };
  } catch {
    return { status: 0, ms: Date.now() - start, body: "" };
  } finally {
    clearTimeout(timer);
  }
}

function stateForStatus(status: number): CheckResult["state"] {
  if (status === 0) return "fail";
  if (status >= 200 && status < 300) return "ok";
  if (status === 404) return "fail";
  if (status >= 500) return "fail";
  // fetch() follows redirects, so 3xx never surfaces here; anything else
  // (401/403/429…) is a warning worth looking at.
  return "warn";
}

/**
 * Pull the bare verification code out of whatever the admin typed in the
 * settings — a full meta tag (<meta name="..." content="CODE">), a filename
 * (CODE.html), a prefixed code (googleCODE, yandex_CODE, pinterest-CODE) or a
 * plain code. This keeps the file paths we probe correct no matter which
 * format the settings store, and mirrors the layout's extractMetaContent.
 */
function bareCode(raw: string): string {
  const cleaned = (raw || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
  const fromTag = cleaned.match(/content=["']([^"']+)["']/)?.[1];
  return (fromTag || cleaned)
    .replace(/^google/i, "")
    .replace(/^(yandex_|pinterest-)/i, "")
    .replace(/\.html?$/i, "")
    .trim();
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();

  // Check the origin the admin is actually viewing (works in dev AND prod).
  const base = req.nextUrl.origin;
  const siteUrl = getSiteUrl();
  const checkedAt = new Date().toISOString();

  const googleFileSetting = (getSetting("google_verification_file") || "").trim();
  const googleMetaSetting = (getSetting("google_verification") || "").trim();
  const googleConfigured = !!(googleFileSetting || googleMetaSetting);
  const googleCode = bareCode(googleFileSetting || googleMetaSetting);
  const googlePath = googleCode ? `/google${googleCode}.html` : "/googledemo123.html";

  // Bing/Yandex/Pinterest: same dynamic file approach. Bing's XML embeds the
  // configured code (so it 404s until configured); Yandex/Pinterest files are
  // served for ANY code, like Google's.
  const bingRaw = (getSetting("bing_verification") || "").trim();
  const yandexRaw = (getSetting("yandex_verification") || "").trim();
  const pinterestRaw = (getSetting("pinterest_verification") || "").trim();
  const bingConfigured = !!bingRaw;
  const yandexConfigured = !!yandexRaw;
  const pinterestConfigured = !!pinterestRaw;
  const yandexCode = bareCode(yandexRaw);
  const pinterestCode = bareCode(pinterestRaw);

  // Which verification meta tags should appear in the homepage <head>.
  const expectedMetas: { name: string; configured: boolean; label: string }[] = [
    { name: "google-site-verification", configured: googleConfigured, label: "Google" },
    { name: "msvalidate.01", configured: bingConfigured, label: "Bing" },
    { name: "yandex-verification", configured: yandexConfigured, label: "Yandex" },
    { name: "p:domain_verify", configured: pinterestConfigured, label: "Pinterest" }
  ];

  const targets = [
    {
      id: "homepage",
      label: "Homepage",
      purpose: "Confirms the site itself is reachable before any file check matters.",
      path: "/",
      expected: "200 OK"
    },
    {
      id: "ads.txt",
      label: "ads.txt",
      purpose: "Required by AdSense to prove you control the domain and approve ad sellers.",
      path: "/ads.txt",
      expected: "200 OK"
    },
    {
      id: "robots.txt",
      label: "robots.txt",
      purpose: "Tells crawlers what to index and points them to the sitemap.",
      path: "/robots.txt",
      expected: "200 OK"
    },
    {
      id: "sitemap.xml",
      label: "sitemap.xml",
      purpose: "The URL list you submit to Google Search Console.",
      path: "/sitemap.xml",
      expected: "200 OK"
    },
    {
      id: "google-file",
      label: googleConfigured
        ? `Google verification (${googlePath.slice(1)})`
        : "Google verification file",
      purpose: "Ownership proof for Search Console — served dynamically for any google<code>.html.",
      path: googlePath,
      expected: "200 OK"
    },
    {
      id: "bing-file",
      label: bingConfigured
        ? "Bing verification (BingSiteAuth.xml)"
        : "Bing verification file",
      purpose: "Bing Webmaster claims the site by reading your code from this XML file.",
      path: "/BingSiteAuth.xml",
      expected: bingConfigured ? "200 OK" : "404 until configured"
    },
    {
      id: "yandex-file",
      label: yandexConfigured
        ? `Yandex verification (yandex_${yandexCode}.html)`
        : "Yandex verification file",
      purpose: "Ownership proof for Yandex Webmaster — served dynamically for any yandex_<code>.html.",
      path: yandexConfigured && yandexCode
        ? `/yandex_${yandexCode}.html`
        : "/yandex_demo123.html",
      expected: "200 OK"
    },
    {
      id: "pinterest-file",
      label: pinterestConfigured
        ? `Pinterest verification (pinterest-${pinterestCode}.html)`
        : "Pinterest verification file",
      purpose: "Pinterest claims the site via this file — served dynamically for any pinterest-<code>.html.",
      path: pinterestConfigured && pinterestCode
        ? `/pinterest-${pinterestCode}.html`
        : "/pinterest-demo123.html",
      expected: "200 OK"
    }
  ];

  const checks: CheckResult[] = [];
  const results = await Promise.all(
    targets.map((t) => probe(`${base}${t.path}`))
  );
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const url = `${base}${t.path}`;
    const { status, ms, body } = results[i];
    let state = stateForStatus(status);
    let note: string;
    let contentCheck: string | undefined;

    // A 404 that is the EXPECTED behavior (e.g. BingSiteAuth.xml before a
    // code is configured) is a warning to act on, not a failure.
    if (status === 404 && /404 until configured/i.test(t.expected)) {
      state = "warn";
    }

    if (status === 0) {
      note = "Unreachable — request timed out or the connection was refused.";
    } else if (status >= 200 && status < 300) {
      note = `Served with HTTP ${status} in ${ms} ms.`;
    } else if (status === 404) {
      note = "HTTP 404 — file not found. It may not be deployed yet.";
    } else if (status >= 500) {
      note = `HTTP ${status} — the server errored serving this file.`;
    } else if (status === 301 || status === 302 || status === 307 || status === 308) {
      note = `HTTP ${status} redirect — crawlers follow it, but a direct 200 is cleaner.`;
    } else {
      note = `Unexpected HTTP ${status}.`;
    }

    switch (t.id) {
      case "homepage":
        if (status >= 200 && status < 300) {
          const configured = expectedMetas.filter((m) => m.configured);
          // Match the actual <meta name="..."> tag, not a bare substring — a
          // comment or description mentioning the tag name must not count.
          const hasMetaTag = (name: string) =>
            body.includes(`<meta name="${name}"`);
          const present = configured.filter((m) => hasMetaTag(m.name));
          if (configured.length === 0) {
            state = "warn";
            note += " No verification meta tags configured yet — add codes in Ad Manager.";
            contentCheck = "No verification meta tags configured.";
          } else if (present.length === configured.length) {
            note += ` All configured verification meta tags (${configured.map((m) => m.label).join(", ")}) render in the <head>.`;
            contentCheck = `Found in <head>: ${present.map((m) => m.label).join(", ")}.`;
          } else {
            state = "warn";
            const missing = configured.filter((m) => !hasMetaTag(m.name));
            note += ` Missing verification meta tags: ${missing.map((m) => m.label).join(", ")}.`;
            contentCheck = `Found: ${present.length ? present.map((m) => m.label).join(", ") : "none"} · Missing: ${missing.map((m) => m.label).join(", ")}.`;
          }
        }
        break;
      case "ads.txt":
        if (status >= 200 && status < 300) {
          if (body.includes("pub-XXXXXXXXXXXXXXXX")) {
            state = "warn";
            note += " Still contains the placeholder publisher ID — replace it in public/ads.txt after AdSense approval.";
          } else if (body.includes("google.com, pub-")) {
            note += " Contains a valid AdSense seller line.";
          } else {
            state = "warn";
            note += " Does not contain a google.com, pub-… seller line — AdSense won't accept it.";
          }
          contentCheck = body.includes("f08c47fec0942fa0")
            ? "Google verification tag (f08c47fec0942fa0) present."
            : "Google verification tag missing.";
        }
        break;
      case "robots.txt":
        if (status >= 200 && status < 300) {
          const hasSitemap = /sitemap:/i.test(body);
          const hasAllow = /allow:\s*\//i.test(body);
          if (hasSitemap && hasAllow) {
            note += " References the sitemap and allows crawling.";
          } else {
            state = "warn";
            note += hasSitemap
              ? " Missing an Allow rule for the root."
              : " Does not reference the sitemap — Google won't auto-discover it.";
          }
          contentCheck = `Sitemap line: ${hasSitemap ? "present" : "missing"} · Allow /: ${hasAllow ? "present" : "missing"}`;
        }
        break;
      case "sitemap.xml":
        if (status >= 200 && status < 300) {
          const hasUrlset = body.includes("<urlset");
          const urlCount = (body.match(/<url>/g) || []).length;
          if (hasUrlset && urlCount > 0) {
            note += ` Valid urlset with ${urlCount} URL entr${urlCount === 1 ? "y" : "ies"}.`;
          } else {
            state = "warn";
            note += " Markup looks wrong — expected a <urlset> with <url> entries.";
          }
          contentCheck = `${urlCount} <url> entr${urlCount === 1 ? "y" : "ies"} detected.`;
        }
        break;
      case "google-file":
        if (status >= 200 && status < 300) {
          if (body.includes("google-site-verification:")) {
            note += " Returns the correct verification line.";
          } else {
            state = "warn";
            note += " Served, but without the expected google-site-verification line.";
          }
          if (!googleConfigured) {
            state = "warn";
            note =
              " No verification code is configured yet — this is a demo URL proving the dynamic route works. Add your code in Ad Manager → Google site verification.";
          }
          contentCheck = googleConfigured ? "Checking your configured code." : "Demo URL — any google<code>.html is served.";
        }
        break;
      default:
        break;
    }

    checks.push({
      id: t.id,
      label: t.label,
      purpose: t.purpose,
      path: t.path,
      url,
      expected: t.expected,
      status,
      ms,
      state,
      note,
      contentCheck
    });
  }

  return NextResponse.json({ checkedAt, base, siteUrl, googleConfigured, checks });
}
