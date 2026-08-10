import Script from "next/script";
import { getAdsByLocation, isAdsenseEnabled, getSetting } from "@/lib/queries";
import { Megaphone } from "lucide-react";
import { getServerLang } from "@/lib/server-lang";
import { t } from "@/lib/i18n";

export default function AdSlot({
  location,
  className = ""
}: {
  location: string;
  className?: string;
}) {
  const lang = getServerLang();
  // The platform is free for everyone — ads show for all visitors. There is
  // no paid tier that hides them anymore.

  let ads: { code: string }[] = [];
  let adsenseEnabled = false;
  let adsenseClient = "";
  try {
    ads = getAdsByLocation(location);
    adsenseEnabled = isAdsenseEnabled();
    adsenseClient = getSetting("adsense_client");
  } catch {
    /* DB not ready */
  }

  const enabledAds = ads.filter((a) => a.code.trim().length > 0);

  // Nothing configured at this location → render nothing.
  if (ads.length === 0) return null;

  // Custom HTML ad codes take priority.
  if (enabledAds.length > 0) {
    return (
      <div className={className} role="complementary" aria-label={t(lang, "ad.advertisement")}>
        {enabledAds.map((ad, i) => (
          <div
            key={i}
            className="w-full overflow-hidden text-center text-xs text-ink-400"
            dangerouslySetInnerHTML={{ __html: ad.code }}
          />
        ))}
      </div>
    );
  }

  // AdSense mode: render unit + loader + push for this slot.
  if (adsenseEnabled && adsenseClient) {
    return (
      <div className={className} role="complementary" aria-label={t(lang, "ad.advertisement")}>
        <ins
          className="adsbygoogle block w-full"
          data-ad-client={adsenseClient}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(adsbygoogle = window.adsbygoogle || []).push({});`
          }}
        />
        <Script
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          crossOrigin="anonymous"
        />
      </div>
    );
  }

  // Placeholder while ads are being set up.
  return (
    <div
      className={`flex min-h-[90px] items-center justify-center rounded-lg border border-dashed border-ink-200 bg-ink-50/60 ${className}`}
      role="complementary"
      aria-label={t(lang, "ad.placeholder")}
    >
      <div className="flex flex-col items-center gap-1 text-ink-400">
        <Megaphone className="h-5 w-5" />
        <span className="text-xs font-medium uppercase tracking-wider">
          {t(lang, "ad.placeholder")}
        </span>
      </div>
    </div>
  );
}
