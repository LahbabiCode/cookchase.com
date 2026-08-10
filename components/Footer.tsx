import Link from "next/link";
import { Scale, Twitter, Facebook, Instagram, Mail } from "lucide-react";
import { getSettings } from "@/lib/queries";
import { getToolCategories } from "@/lib/queries";
import { ToolIcon } from "@/lib/icons";
import { categoryToSlug } from "@/lib/category-hubs";
import { getServerLang } from "@/lib/server-lang";
import { t } from "@/lib/i18n";

export default function Footer() {
  const lang = getServerLang();
  let settings: Record<string, string> = {};
  let categories: { category: string; count: number }[] = [];
  try {
    settings = getSettings();
    categories = getToolCategories();
  } catch {
    /* DB not ready */
  }

  const year = new Date().getFullYear();
  const socials = [
    { label: "Twitter", href: settings.social_twitter || "#", Icon: Twitter },
    { label: "Facebook", href: settings.social_facebook || "#", Icon: Facebook },
    { label: "Instagram", href: settings.social_instagram || "#", Icon: Instagram }
  ];

  return (
    <footer className="border-t border-ink-200 bg-linen">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-copper-200 shadow-sm">
                <Scale className="h-5 w-5" />
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-ink-900">
                Cook<span className="text-brand-700">Chase</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-500">
              {settings.footer_text || t(lang, "footer.tagline")}
            </p>
            <div className="mt-4 flex gap-3">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 bg-white text-ink-500 transition hover:border-brand-300 hover:text-brand-600"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
              <a
                href={`mailto:${settings.site_email || "hello@cookchase.com"}`}
                aria-label="Email"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 bg-white text-ink-500 transition hover:border-brand-300 hover:text-brand-600"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              {t(lang, "footer.explore")}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link className="text-ink-600 hover:text-brand-600" href="/tools">{t(lang, "footer.allTools")}</Link></li>
              <li><Link className="text-ink-600 hover:text-brand-600" href="/favorites">{t(lang, "nav.myFavorites")}</Link></li>
              <li><Link className="text-ink-600 hover:text-brand-600" href="/blog">{t(lang, "nav.blog")}</Link></li>
              <li><Link className="text-ink-600 hover:text-brand-600" href="/about">{t(lang, "nav.about")} CookChase</Link></li>
              <li><Link className="text-ink-600 hover:text-brand-600" href="/contact">{t(lang, "nav.contact")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              {t(lang, "footer.categories")}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {categories.slice(0, 6).map((c) => {
                const hubSlug = categoryToSlug(c.category);
                return (
                  <li key={c.category}>
                    <Link
                      className="text-ink-600 hover:text-brand-600"
                      href={
                        hubSlug
                          ? `/tools/${hubSlug}`
                          : `/tools?category=${encodeURIComponent(c.category)}`
                      }
                    >
                      {c.category} ({c.count})
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              {t(lang, "footer.legal")}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link className="text-ink-600 hover:text-brand-600" href="/privacy">{t(lang, "footer.privacy")}</Link></li>
              <li><Link className="text-ink-600 hover:text-brand-600" href="/terms">{t(lang, "footer.terms")}</Link></li>
              <li><Link className="text-ink-600 hover:text-brand-600" href="/sitemap.xml">{t(lang, "footer.sitemap")}</Link></li>
              <li>
                <Link className="text-ink-600 hover:text-brand-600" href="/admin">
                  {t(lang, "footer.admin")}
                </Link>
              </li>
            </ul>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-ink-400">
              <ToolIcon name="Shield" className="h-3.5 w-3.5" />
              {t(lang, "tool.freeForever")}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-ink-200 pt-6 text-center text-xs text-ink-400">
          {t(lang, "footer.copyright", {
            year,
            site: settings.site_name || "CookChase"
          })}
        </div>
      </div>
    </footer>
  );
}
