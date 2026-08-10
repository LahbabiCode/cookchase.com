import { NextRequest, NextResponse } from "next/server";
import { getSetting } from "@/lib/queries";

// Search-engine ownership verification files, served dynamically.
//
// Google:    google<code>.html            → "google-site-verification: google<code>.html"
// Yandex:    yandex_<code>.html           → HTML wrapper with "Verification: <code>"
// Pinterest: pinterest-<code>.html        → content is the claim code itself
// Bing:      BingSiteAuth.xml             → XML embedding the bing_verification setting
//
// Google, Yandex and Pinterest ask site owners to upload a file named with a
// per-account code. Because every account gets a different code, we serve the
// correct content for ANY matching URL dynamically — so verification works the
// moment the service asks for the file, with zero manual file editing or
// redeploys. Bing's XML embeds the configured code, so it needs a value set in
// Ad Manager first (and 404s otherwise, which Bing accepts as "not claimed").

const GOOGLE_FILE_PATTERN = /^google([A-Za-z0-9_-]+)\.html$/;
const YANDEX_FILE_PATTERN = /^yandex_([A-Za-z0-9_-]+)\.html$/;
const PINTEREST_FILE_PATTERN = /^pinterest-([A-Za-z0-9_-]+)\.html$/;

export function GET(req: NextRequest) {
  const name = req.nextUrl.pathname.slice(1); // strip the leading "/"

  const google = name.match(GOOGLE_FILE_PATTERN);
  if (google) {
    const code = google[1];
    return new NextResponse(`google-site-verification: google${code}.html`, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  // Yandex wants a full HTML document whose body contains the line
  // "Verification: <code>" — exactly what it gave you in the download.
  const yandex = name.match(YANDEX_FILE_PATTERN);
  if (yandex) {
    const code = yandex[1];
    return new NextResponse(
      [
        "<html>",
        "<head>",
        '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">',
        "</head>",
        `<body>Verification: ${code}</body>`,
        "</html>"
      ].join("\n"),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Pinterest looks for the claim code in the file — the bare code matches
  // what Pinterest's checker searches for.
  const pinterest = name.match(PINTEREST_FILE_PATTERN);
  if (pinterest) {
    const code = pinterest[1];
    return new NextResponse(code, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  // Bing verifies the site by reading its code out of this XML file.
  if (name === "BingSiteAuth.xml") {
    // Accept either the bare code or a full meta tag pasted by mistake; the
    // regex also guarantees only URL-safe characters reach the XML body.
    const raw = (getSetting("bing_verification") || "").trim();
    const cleaned = raw
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'");
    const fromTag = cleaned.match(/content=["']([^"']+)["']/)?.[1];
    const bingCode = (fromTag || cleaned)
      .replace(/\.html?$/i, "")
      .match(/[A-Za-z0-9_-]+/)?.[0]
      ?.trim();
    if (!bingCode) {
      return new NextResponse("Not Found", { status: 404 });
    }
    return new NextResponse(
      [
        '<?xml version="1.0"?>',
        "<users>",
        `  <user>${bingCode}</user>`,
        "</users>"
      ].join("\n"),
      { headers: { "Content-Type": "application/xml; charset=utf-8" } }
    );
  }

  return new NextResponse("Not Found", { status: 404 });
}
