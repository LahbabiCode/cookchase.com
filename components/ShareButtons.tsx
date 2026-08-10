"use client";

import { useEffect, useState } from "react";
import { Facebook, Twitter, Linkedin, Mail, Pin, Link2, Check } from "lucide-react";
import { useLang } from "@/lib/useLang";
import { buildShareHrefs, openShare } from "@/lib/share";

export default function ShareButtons({
  title,
  url: urlProp,
  compact = false
}: {
  title: string;
  /** Explicit URL to share — used on article cards, where each card shares its own article. */
  url?: string;
  /** Compact row for card grids: smaller buttons and no "Share" label. */
  compact?: boolean;
}) {
  const { t } = useLang();
  const [url, setUrl] = useState(urlProp || "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(urlProp || window.location.href);
  }, [urlProp]);

  const hrefs = url ? buildShareHrefs(url, title) : null;

  const shares = [
    { label: t("share.onFacebook"), href: hrefs?.facebook ?? "", Icon: Facebook },
    { label: t("share.onX"), href: hrefs?.x ?? "", Icon: Twitter },
    { label: t("share.onPinterest"), href: hrefs?.pinterest ?? "", Icon: Pin },
    { label: t("share.onLinkedIn"), href: hrefs?.linkedin ?? "", Icon: Linkedin },
    { label: t("share.byEmail"), href: hrefs?.email ?? "", Icon: Mail }
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  const btnCls = compact
    ? "flex h-7 w-7 items-center justify-center rounded-md border border-ink-100 bg-white text-ink-400 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
    : "flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 bg-white text-ink-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600";
  const iconCls = compact ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {!compact && (
        <span className="mr-1 text-xs font-medium uppercase tracking-wide text-ink-400">
          {t("share.share")}
        </span>
      )}
      {shares.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={url ? href : undefined}
          onClick={(e) => {
            if (!url) return;
            if (openShare(href)) e.preventDefault();
          }}
          target={href.startsWith("mailto:") ? undefined : "_blank"}
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className={btnCls}
        >
          <Icon className={iconCls} />
        </a>
      ))}
      <button
        onClick={copy}
        aria-label={t("share.copyLink")}
        title={t("share.copyLink")}
        className={btnCls}
      >
        {copied ? <Check className={`${iconCls} text-green-600`} /> : <Link2 className={iconCls} />}
      </button>
    </div>
  );
}
