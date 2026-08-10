"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  LayoutGrid,
  FileText,
  Newspaper,
  Megaphone,
  MessageSquare,
  Users,
  CreditCard,
  Settings,
  LogOut,
  ExternalLink,
  BellRing,
  SearchCheck,
  Inbox,
  BadgeCheck,
  Scale,
  BadgeDollarSign,
  Rocket,
  BarChart3
} from "lucide-react";
// Note: CreditCard was used by the removed Subscriptions link.

const links = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/stats", label: "Traffic Analytics", Icon: BarChart3 },
  { href: "/admin/tools", label: "Tools", Icon: Wrench },
  { href: "/admin/ingredients", label: "Ingredient Densities", Icon: Scale },
  { href: "/admin/food-prices", label: "Food Prices", Icon: BadgeDollarSign },
  { href: "/admin/sections", label: "Homepage Sections", Icon: LayoutGrid },
  { href: "/admin/pages", label: "Pages", Icon: FileText },
  { href: "/admin/articles", label: "Articles", Icon: Newspaper },
  { href: "/admin/comments", label: "Comments", Icon: MessageSquare },
  { href: "/admin/inbox", label: "Contact Inbox", Icon: Inbox },
  { href: "/admin/accounts", label: "Accounts", Icon: Users },
  { href: "/admin/ads", label: "Ad Manager", Icon: Megaphone },
  { href: "/admin/adsense", label: "AdSense Ready", Icon: BadgeCheck },
  { href: "/admin/seo", label: "SEO Checker", Icon: SearchCheck },
  { href: "/admin/deploy", label: "Deploy", Icon: Rocket },
  { href: "/admin/settings", label: "Settings", Icon: Settings }
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    // Lightweight badge: ?count=1 skips the alert sweep — just the COUNT query.
    fetch("/api/admin/alerts?count=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setAlertCount(j.unread || 0))
      .catch(() => {});
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-ink-200 bg-white">
      <Link href="/admin" className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          CC
        </span>
        <div>
          <p className="text-sm font-bold leading-tight text-ink-900">CookChase</p>
          <p className="text-[11px] leading-tight text-ink-400">Admin Panel</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {links.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
              }`}
            >
              {href === "/admin" ? (
                <span className="flex w-5 items-center justify-center">
                  {alertCount > 0 ? (
                    <span className="relative">
                      <BellRing className="h-4 w-4 text-amber-600" />
                      <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[9px] font-bold text-white">
                        {alertCount > 9 ? "9+" : alertCount}
                      </span>
                    </span>
                  ) : (
                    <BellRing className="h-4 w-4" />
                  )}
                </span>
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-ink-200 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-100 hover:text-ink-900"
        >
          <ExternalLink className="h-4 w-4" />
          View site
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
