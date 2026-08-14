"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Scale, Heart, LogOut, UserRound, ShieldCheck } from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";
import { useLang } from "@/lib/useLang";
import SearchBox from "./SearchBox";

const navLinks = [
  { href: "/", labelKey: "nav.home" },
  { href: "/tools", labelKey: "nav.tools" },
  { href: "/blog", labelKey: "nav.blog" },
  { href: "/about", labelKey: "nav.about" }
];

function FavoritesLink() {
  const { favorites, ready } = useFavorites();
  return (
    <Link
      href="/favorites"
      aria-label={`Favorite tools (${favorites.length})`}
      className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink-500 transition hover:bg-ink-100 hover:text-red-500"
    >
      <Heart className={`h-[18px] w-[18px] ${favorites.length ? "fill-red-500 text-red-500" : ""}`} />
      {ready && favorites.length > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {favorites.length}
        </span>
      )}
    </Link>
  );
}

function AccountLink() {
  const { ready, auth, email, signOut } = useFavorites();
  if (!ready) return null;

  if (auth === "signedIn") {
    const initial = (email || "A").charAt(0).toUpperCase();
    return (
      <div className="flex items-center gap-1.5">
        <Link
          href="/account"
          title={`${email} — manage your account`}
          aria-label="My account"
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          {initial}
        </Link>
        <button
          onClick={() => signOut()}
          title="Sign out"
          aria-label="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-md text-ink-500 transition hover:bg-ink-100 hover:text-red-500"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/favorites"
      className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:border-brand-400 hover:text-brand-600"
    >
      <UserRound className="h-4 w-4" />
      Sign in
    </Link>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const { auth, email } = useFavorites();
  const { t } = useLang();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="CookChase home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-copper-200 shadow-sm">
            <Scale className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-ink-900">
            Cook<span className="text-brand-700">Chase</span>
          </span>
        </Link>

        <div className="mx-4 hidden w-full max-w-xs md:block lg:max-w-sm">
          <SearchBox />
        </div>

        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-brand-50 hover:text-brand-800"
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <div className="ml-1">
            <FavoritesLink />
          </div>
          <div className="ml-1">
            <AccountLink />
          </div>
        </nav>

        <button
          className="rounded-md p-2 text-ink-700 hover:bg-brand-50 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav
          className="border-t border-ink-200 bg-white px-4 pb-4 pt-3 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mb-3">
            <SearchBox onNavigate={() => setOpen(false)} />
          </div>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <Link
            href="/favorites"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center gap-2 rounded-md border-t border-ink-100 px-3 py-2.5 pt-4 text-sm font-medium text-ink-700 hover:bg-ink-100"
          >
            <Heart className="h-4 w-4" />
            {t("nav.myFavorites")}
          </Link>
          <Link
            href={auth === "signedIn" ? "/account" : "/favorites"}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
          >
            <UserRound className="h-4 w-4" />
            {auth === "signedIn" ? t("nav.signedInAs", { email }) : t("nav.signIn")}
          </Link>
          {auth === "signedIn" && (
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
            >
              <ShieldCheck className="h-4 w-4" />
              {t("nav.myAccount")}
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
