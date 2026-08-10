import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { getToolBySlug, getSetting } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 };

// Local Inter fonts (WOFF). Passing fonts explicitly avoids the Windows
// path-handling bug in @vercel/og's built-in default font loader.
const FONT_DIR = join(process.cwd(), "public", "fonts");
const FONTS = [
  {
    name: "Inter",
    data: readFileSync(join(FONT_DIR, "inter-400.woff")),
    weight: 400 as const,
    style: "normal" as const
  },
  {
    name: "Inter",
    data: readFileSync(join(FONT_DIR, "inter-700.woff")),
    weight: 700 as const,
    style: "normal" as const
  }
];

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  // DB is guarded so a transient read failure still renders the brand card
  // instead of 500ing the image (same pattern as app/layout.tsx).
  let siteName = "CookChase";
  let tool: ReturnType<typeof getToolBySlug> = null;
  try {
    siteName = getSetting("site_name") || "CookChase";
    tool = getToolBySlug(params.slug);
  } catch {
    /* DB not ready */
  }

  const brand = "#2c6349";
  const copper = "#b5651d";
  const name = tool?.name || siteName;
  const tagline =
    tool?.tagline ||
    "Free cooking tools, calculators and guides — no sign-up, no fluff.";
  const category = tool?.category || "Cooking tools";
  const slug = tool?.slug || "cookchase";

  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0b1f17 0%, #173529 45%, #234f3c 100%)",
          fontFamily: "Inter, sans-serif",
          color: "white",
          padding: "72px",
          position: "relative"
        }}
      >
        {/* soft radial glow (satori-safe) */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "520px",
            height: "520px",
            borderRadius: "9999px",
            background: "rgba(255,255,255,0.08)"
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            marginBottom: "28px"
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              background: brand,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "10px",
                background: copper,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            />
          </div>
          <div
            style={{
              fontSize: "30px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              opacity: 0.92
            }}
          >
            cookchase.com
          </div>
        </div>
        <div
          style={{
            fontSize: "84px",
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            maxWidth: "1000px"
          }}
        >
          {name}
        </div>
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <div style={{ width: "10px", height: "10px", borderRadius: "9999px", background: copper }} />
          <div style={{ fontSize: "20px", fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
            kitchen math
          </div>
        </div>
        <div
          style={{
            fontSize: "32px",
            textAlign: "center",
            opacity: 0.85,
            marginTop: "24px",
            maxWidth: "880px",
            lineHeight: 1.4
          }}
        >
          {tagline}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "44px",
            display: "flex",
            alignItems: "center",
            fontSize: "22px",
            fontWeight: 600,
            opacity: 0.7,
            letterSpacing: "0.06em",
            textTransform: "uppercase"
          }}
        >
          {`${category} · Free forever · ${slug}`}
        </div>
      </div>
    ),
    {
      ...SIZE,
      fonts: FONTS
    }
  );

  // These images are static per slug — let browsers, crawlers and social
  // scrapers cache them.
  response.headers.set(
    "Cache-Control",
    "public, max-age=86400, s-maxage=604800, immutable"
  );
  return response;
}
