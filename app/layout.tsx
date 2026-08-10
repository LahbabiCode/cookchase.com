import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import { getSettings, getSiteUrl } from "@/lib/queries";

// Display face with a hand-built, workbench personality.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap"
});

// Warm, readable body face for instructions and long copy.
const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap"
});

// Mono for every number, measurement and label — the kitchen-scale readout.
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap"
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1
};

// Accept either the bare content value (e.g. google1a2b3c...) or a full
// <meta name="..." content="..."> tag pasted by mistake (with or without
// HTML-encoded quotes, e.g. &quot;).
function extractMetaContent(raw: string): string {
  const cleaned = raw.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
  return cleaned.match(/content=["']([^"']+)["']/)?.[1] || cleaned.trim();
}

export function generateMetadata(): Metadata {
  let settings: Record<string, string> = {};
  let siteUrl = "https://cookchase.com";
  try {
    settings = getSettings();
    siteUrl = getSiteUrl();
  } catch {
    /* DB not ready during early build */
  }
  const title =
    settings.default_meta_title || "CookChase — Free Cooking Tools & Kitchen Calculators";
  const description =
    settings.default_meta_description ||
    "20+ free interactive cooking tools: recipe scaler, unit converter, meat cooking times, baking calculators and more.";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${settings.site_name || "CookChase"}`
    },
    description,
    keywords: settings.default_keywords,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName: settings.site_name || "CookChase",
      title,
      description
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1
      }
    }
  };
}

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  // Search-engine verification codes are rendered DIRECTLY in the <head> here
  // (not just via metadata.other) so they are guaranteed to appear on every
  // page — Next.js's metadata merge can drop some `other` keys.
  let settings: Record<string, string> = {};
  try {
    settings = getSettings();
  } catch {
    /* DB not ready during early build */
  }
  const verificationTags: { name: string; content: string }[] = [];
  const pushVerification = (raw: string, name: string) => {
    const content = extractMetaContent(raw);
    if (content) verificationTags.push({ name, content });
  };
  pushVerification(settings.google_verification, "google-site-verification");
  pushVerification(settings.bing_verification, "msvalidate.01");
  pushVerification(settings.yandex_verification, "yandex-verification");
  pushVerification(settings.pinterest_verification, "p:domain_verify");

  // The site is English-only: the document is always English, left-to-right.

  return (
    <html lang="en" dir="ltr">
      <head>
        {/* Apply Easy Mode before paint to avoid a flash of default styles. Easy
            and Compact are opposites — each pre-paint only fires when the other
            mode is OFF, so a stale localStorage carrying both keys can never put
            both classes on <html> (which would combine contradictory CSS). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('cookchase_easy_mode')==='1'&&localStorage.getItem('cookchase_compact_mode')!=='1'){document.documentElement.classList.add('easy-mode')}}catch(e){}`
          }}
        />
        {/* Dark high-contrast is a sub-option of Easy Mode: the class only has
            visual effect while easy-mode is on (CSS gates on both classes). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('cookchase_easy_mode')==='1'&&localStorage.getItem('cookchase_easy_contrast')==='1'){document.documentElement.classList.add('easy-contrast')}}catch(e){}`
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('cookchase_compact_mode')==='1'&&localStorage.getItem('cookchase_easy_mode')!=='1'){document.documentElement.classList.add('compact-mode')}}catch(e){}`
          }}
        />
        {verificationTags.map((t) => (
          <meta key={t.name} name={t.name} content={t.content} />
        ))}
      </head>
      <body
        className={`${bricolage.variable} ${instrument.variable} ${spaceMono.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
