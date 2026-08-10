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
  what: string;
  why: string;
  state: "ok" | "warn" | "fail";
  detail: string;
  extra?: string;
}

async function probe(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "CookChase-AdSense-Checker/1.0" }
    });
    let body = "";
    try {
      body = (await res.text()).slice(0, 200_000);
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

export async function GET(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();

  const base = req.nextUrl.origin;
  const siteUrl = getSiteUrl();
  const siteName = getSetting("site_name") || "CookChase";
  const checkedAt = new Date().toISOString();

  const adsenseClient = (getSetting("adsense_client") || "").trim();
  const adsenseEnabled = getSetting("adsense_enabled") === "1";

  // --- Batch the network probes -------------------------------------------
  const targets = [
    { id: "homepage", path: "/" },
    { id: "ads.txt", path: "/ads.txt" },
    { id: "robots.txt", path: "/robots.txt" },
    { id: "sitemap.xml", path: "/sitemap.xml" },
    { id: "privacy", path: "/privacy" },
    { id: "terms", path: "/terms" }
  ];
  const results = await Promise.all(
    targets.map((t) => probe(`${base}${t.path}`))
  );
  const byId = new Map<string, { status: number; ms: number; body: string }>();
  for (let i = 0; i < targets.length; i++) {
    byId.set(targets[i].id, results[i]);
  }

  const homepage = byId.get("homepage")!;
  const checks: CheckResult[] = [];

  // --- 1. HTTPS ------------------------------------------------------------
  const viewingHttps = base.startsWith("https://");
  const productionHttps = siteUrl.startsWith("https://");
  if (viewingHttps && productionHttps) {
    checks.push({
      id: "https",
      label: "HTTPS is on",
      what: `You're viewing ${base} over a secure connection.`,
      why: "Google requires HTTPS on every page for AdSense; a mixed or plain-HTTP site is rejected during review.",
      state: "ok",
      detail: `Serving over HTTPS now · production URL ${siteUrl} also uses HTTPS`
    });
  } else if (productionHttps) {
    checks.push({
      id: "https",
      label: "HTTPS in production",
      what: `Local preview is ${base.startsWith("http:") ? "plain HTTP" : "HTTPS"}, but your production URL is ${siteUrl}.`,
      why: "AdSense reviewers load the public domain — localhost over HTTP is normal and fine.",
      state: "warn",
      detail: "Local preview runs without TLS — this is expected on your own machine. The public domain is what matters."
    });
  } else {
    checks.push({
      id: "https",
      label: "HTTPS is off",
      what: `Your production URL (${siteUrl}) is plain HTTP.`,
      why: "AdSense will reject a site served over plain HTTP. Deploy behind TLS (Vercel/Railway provide it automatically).",
      state: "fail",
      detail: "Set site_url to https://… or make sure your host terminates TLS and redirects HTTP → HTTPS."
    });
  }

  // --- 2. Homepage reachability -------------------------------------------
  if (homepage.status >= 200 && homepage.status < 300) {
    checks.push({
      id: "homepage",
      label: "Site loads",
      what: `${siteName} returned HTTP ${homepage.status} in ${homepage.ms} ms.`,
      why: "A reachable, error-free homepage is the baseline requirement for AdSense review.",
      state: "ok",
      detail: "Homepage responds with a 2xx status."
    });
  } else {
    checks.push({
      id: "homepage",
      label: "Site loads",
      what:
        homepage.status === 0
          ? "Homepage unreachable (timeout or connection refused)."
          : `Homepage returned HTTP ${homepage.status}.`,
      why: "AdSense reviewers must be able to load your site from anywhere. Fix deployment or DNS first.",
      state: "fail",
      detail:
        homepage.status === 0
          ? "The request timed out. Check that the server is running and reachable."
          : "Non-2xx status on the homepage."
    });
  }

  // --- 3. ads.txt ----------------------------------------------------------
  const ads = byId.get("ads.txt")!;
  if (ads.status >= 200 && ads.status < 300) {
    if (ads.body.includes("pub-XXXXXXXXXXXXXXXX")) {
      checks.push({
        id: "ads.txt",
        label: "ads.txt",
        what: "ads.txt is served, but still contains the placeholder publisher ID.",
        why: "AdSense reads ads.txt to confirm you control the domain. The placeholder won't verify.",
        state: "warn",
        detail: "Replace pub-XXXXXXXXXXXXXXXX in public/ads.txt with your real ID after approval."
      });
    } else if (ads.body.includes("google.com, pub-")) {
      checks.push({
        id: "ads.txt",
        label: "ads.txt",
        what: "ads.txt is served with a valid google.com, pub-… seller line.",
        why: "AdSense verifies ad-seller authorization from this file.",
        state: "ok",
        detail: "Contains a Google AdSense seller line."
      });
    } else {
      checks.push({
        id: "ads.txt",
        label: "ads.txt",
        what: "ads.txt is served but has no google.com, pub-… seller line.",
        why: "Without a valid seller line AdSense won't accept the file.",
        state: "warn",
        detail: "Add a line like: google.com, pub-XXXXXXXXXXXX, DIRECT, f08c47fec0942fa0"
      });
    }
  } else if (ads.status === 0) {
    checks.push({
      id: "ads.txt",
      label: "ads.txt",
      what: "ads.txt is unreachable.",
      why: "AdSense crawls /ads.txt to verify domain control.",
      state: "fail",
      detail: "Make sure public/ads.txt is deployed."
    });
  } else {
    checks.push({
      id: "ads.txt",
      label: "ads.txt",
      what: `ads.txt returned HTTP ${ads.status}.`,
      why: "AdSense expects this file to be publicly reachable with a 200.",
      state: "fail",
      detail: "A 404 or error here blocks AdSense verification."
    });
  }

  // --- 4. robots.txt -------------------------------------------------------
  const robots = byId.get("robots.txt")!;
  if (robots.status >= 200 && robots.status < 300) {
    const hasSitemap = /sitemap:/i.test(robots.body);
    const allowsCrawl = /allow:\s*\//i.test(robots.body);
    if (hasSitemap && allowsCrawl) {
      checks.push({
        id: "robots.txt",
        label: "robots.txt",
        what: "robots.txt is served, allows crawling and references the sitemap.",
        why: "Google must be able to crawl and find your sitemap for indexing — which AdSense review checks.",
        state: "ok",
        detail: "Allow / present · Sitemap: line present"
      });
    } else {
      checks.push({
        id: "robots.txt",
        label: "robots.txt",
        what: hasSitemap
          ? "robots.txt references the sitemap but may block crawling."
          : "robots.txt is served but doesn't reference the sitemap.",
        why: "Google auto-discovers the sitemap through robots.txt; a blocked crawl stops indexing.",
        state: "warn",
        detail: hasSitemap ? "Confirm there's an Allow: / rule." : "Add: Sitemap: /sitemap.xml"
      });
    }
  } else if (robots.status === 0) {
    checks.push({
      id: "robots.txt",
      label: "robots.txt",
      what: "robots.txt is unreachable.",
      why: "It's generated automatically — if it 404s, redeploy so the route is live.",
      state: "fail",
      detail: "Expected at /robots.txt"
    });
  } else {
    checks.push({
      id: "robots.txt",
      label: "robots.txt",
      what: `robots.txt returned HTTP ${robots.status}.`,
      why: "A robots.txt that errors can stop Google from indexing the site.",
      state: "fail",
      detail: "Check the app/robots.ts generator."
    });
  }

  // --- 5. sitemap.xml ------------------------------------------------------
  const sitemap = byId.get("sitemap.xml")!;
  if (sitemap.status >= 200 && sitemap.status < 300) {
    const urlCount = (sitemap.body.match(/<url>/g) || []).length;
    if (sitemap.body.includes("<urlset") && urlCount > 0) {
      checks.push({
        id: "sitemap.xml",
        label: "sitemap.xml",
        what: `sitemap.xml is valid with ${urlCount} URL entr${urlCount === 1 ? "y" : "ies"}.`,
        why: "AdSense review values an indexed, crawlable site — submit this sitemap in Search Console.",
        state: "ok",
        detail: `${urlCount} <url> entr${urlCount === 1 ? "y" : "ies"} · submit to Google Search Console`
      });
    } else {
      checks.push({
        id: "sitemap.xml",
        label: "sitemap.xml",
        what: "sitemap.xml is served but looks malformed.",
        why: "A broken sitemap wastes crawl budget and can stall indexing.",
        state: "warn",
        detail: "Expected a <urlset> with <url> entries."
      });
    }
  } else if (sitemap.status === 0) {
    checks.push({
      id: "sitemap.xml",
      label: "sitemap.xml",
      what: "sitemap.xml is unreachable.",
      why: "It's generated automatically — redeploy so the route is live, then submit it.",
      state: "fail",
      detail: "Expected at /sitemap.xml"
    });
  } else {
    checks.push({
      id: "sitemap.xml",
      label: "sitemap.xml",
      what: `sitemap.xml returned HTTP ${sitemap.status}.`,
      why: "Google needs a working sitemap to index all your pages.",
      state: "fail",
      detail: "Check the app/sitemap.ts generator."
    });
  }

  // --- 6. Privacy Policy ---------------------------------------------------
  const privacy = byId.get("privacy")!;
  if (privacy.status >= 200 && privacy.status < 300) {
    const words = privacy.body.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length;
    if (words > 150) {
      checks.push({
        id: "privacy",
        label: "Privacy Policy",
        what: `Privacy page loads with substantial content (~${words} words).`,
        why: "AdSense requires a real privacy policy covering cookies and ad personalization.",
        state: "ok",
        detail: "Covers cookies & Google Ads personalization · editable under Pages"
      });
    } else {
      checks.push({
        id: "privacy",
        label: "Privacy Policy",
        what: "Privacy page loads but looks thin.",
        why: "AdSense reviewers look for a genuine policy that mentions cookies and advertising.",
        state: "warn",
        detail: "Expand it under Admin → Pages → privacy."
      });
    }
  } else if (privacy.status === 0) {
    checks.push({
      id: "privacy",
      label: "Privacy Policy",
      what: "Privacy page is unreachable.",
      why: "A missing privacy policy is a common AdSense rejection reason.",
      state: "fail",
      detail: "Expected at /privacy — create it under Pages."
    });
  } else {
    checks.push({
      id: "privacy",
      label: "Privacy Policy",
      what: `Privacy page returned HTTP ${privacy.status}.`,
      why: "It must be publicly accessible without errors.",
      state: "fail",
      detail: "Check the /privacy page."
    });
  }

  // --- 7. Terms ------------------------------------------------------------
  const terms = byId.get("terms")!;
  if (terms.status >= 200 && terms.status < 300) {
    checks.push({
      id: "terms",
      label: "Terms of Service",
      what: `Terms page loads (HTTP ${terms.status}).`,
      why: "AdSense wants clear site rules; a terms page is part of a policy-complete site.",
      state: "ok",
      detail: "Served at /terms · editable under Pages"
    });
  } else if (terms.status === 0) {
    checks.push({
      id: "terms",
      label: "Terms of Service",
      what: "Terms page is unreachable.",
      why: "A missing terms page can hold up AdSense review.",
      state: "fail",
      detail: "Expected at /terms — create it under Pages."
    });
  } else {
    checks.push({
      id: "terms",
      label: "Terms of Service",
      what: `Terms page returned HTTP ${terms.status}.`,
      why: "It must be publicly accessible without errors.",
      state: "fail",
      detail: "Check the /terms page."
    });
  }

  // --- 8. AdSense config ---------------------------------------------------
  if (adsenseEnabled && adsenseClient) {
    checks.push({
      id: "adsense-config",
      label: "AdSense publisher ID",
      what: `Publisher ID is configured (${adsenseClient}) and ads are enabled.`,
      why: "Once approved, this is what makes your ad units serve real ads.",
      state: "ok",
      detail: "Set in Ad Manager → Google AdSense"
    });
  } else if (adsenseClient) {
    checks.push({
      id: "adsense-config",
      label: "AdSense publisher ID",
      what: "Publisher ID is saved but ads are still disabled.",
      why: "Keep ads off until approval (Google penalizes premature ad code), then flip the switch.",
      state: "warn",
      detail: "Enable 'AdSense ads' in Ad Manager after approval."
    });
  } else {
    checks.push({
      id: "adsense-config",
      label: "AdSense publisher ID",
      what: "No publisher ID configured yet.",
      why: "You'll get your pub-… ID from the AdSense dashboard after applying — it's not needed to submit.",
      state: "warn",
      detail: "Not required for the initial application."
    });
  }

  // --- 9. Load speed -------------------------------------------------------
  // The homepage probe above doubles as the speed measurement. If the homepage
  // was unreachable (status 0 — a refused connection returns in a few ms, a
  // timeout in ~8000 ms), we can't measure speed, so report that explicitly
  // instead of scoring an arbitrary timeout value.
  const bodySize = homepage.body.length;
  const ms = homepage.ms;
  const unreachable = homepage.status === 0;
  const speedState: CheckResult["state"] = unreachable
    ? "fail"
    : ms < 1000
      ? "ok"
      : ms <= 3000
        ? "warn"
        : "fail";
  const speedLabel = unreachable ? "" : ms < 1000 ? "Fast" : ms <= 3000 ? "Acceptable" : "Slow";
  checks.push({
    id: "speed",
    label: "Load speed",
    what: unreachable
      ? "Could not measure — the homepage didn't load."
      : `Server responded in ${ms} ms with ~${(bodySize / 1024).toFixed(0)} KB of HTML.`,
    why: "AdSense reviewers (and Google's Core Web Vitals) favor fast pages. Under 1s is great; over 3s is a risk.",
    state: speedState,
    detail: unreachable
      ? "Fix the homepage first, then re-run the check."
      : speedState === "ok"
        ? `${speedLabel} server response — under 1 second.`
        : `${speedLabel} — consider a lighter homepage, caching or a CDN.`
  });

  const counts = checks.reduce(
    (acc, c) => {
      acc[c.state] = (acc[c.state] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const ready = (counts.ok ?? 0) === checks.length;

  return NextResponse.json({
    checkedAt,
    base,
    siteUrl,
    ready,
    counts: { ok: counts.ok ?? 0, warn: counts.warn ?? 0, fail: counts.fail ?? 0 },
    checks
  });
}
