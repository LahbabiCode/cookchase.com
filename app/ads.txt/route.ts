import { NextResponse } from "next/server";
import { getSetting } from "@/lib/queries";

export const dynamic = "force-dynamic";

// ads.txt, served from the database so it can be managed in /admin → Ads
// without a redeploy.
//
// Two ways to drive it, in priority order:
//   1. `ads_txt`        — free-form content typed in the admin panel. Whatever
//                         is there is served verbatim (extra ad networks,
//                         RESELLER lines, several publisher IDs, …).
//   2. `adsense_client` — the AdSense publisher ID. When no custom content is
//                         set we generate the single canonical AdSense line
//                         from it, so filling in one field is enough.
//
// Google's official AdSense certification-authority ID. It identifies Google
// in the ads.txt spec and is the same for every publisher — never change it.
const GOOGLE_CERTIFICATION_AUTHORITY_ID = "f08c47fec0942fa0";

const PLACEHOLDER = [
  "# ads.txt is not configured yet.",
  "# Add your AdSense publisher ID in /admin → Ads and this file fills in",
  "# automatically, or paste custom lines in the ads.txt box on the same page."
].join("\n");

/** `ca-pub-123…`, `pub-123…` or a bare number all normalise to `pub-123…`. */
function normalisePublisherId(raw: string): string | null {
  const digits = raw.trim().match(/(\d{10,})/)?.[1];
  return digits ? `pub-${digits}` : null;
}

export function GET() {
  const custom = (getSetting("ads_txt") || "").trim();
  if (custom) {
    return textResponse(custom);
  }

  const publisherId = normalisePublisherId(getSetting("adsense_client") || "");
  if (!publisherId) {
    return textResponse(PLACEHOLDER);
  }

  return textResponse(
    `google.com, ${publisherId}, DIRECT, ${GOOGLE_CERTIFICATION_AUTHORITY_ID}`
  );
}

function textResponse(body: string) {
  return new NextResponse(body.endsWith("\n") ? body : `${body}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Crawlers re-read ads.txt often; keep it fresh enough that an admin
      // edit shows up quickly but still cacheable at the edge.
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600"
    }
  });
}
