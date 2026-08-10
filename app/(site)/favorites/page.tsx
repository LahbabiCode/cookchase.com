import type { Metadata } from "next";
import { getAllTools, getCommentsByToolMap, getViewsByToolMap } from "@/lib/queries";
import FavoritesClient from "./FavoritesClient";
import { getServerLang } from "@/lib/server-lang";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    title: "Your Favorite Tools",
    description:
      "Save the cooking tools you love and sync your favorites across every device with a free CookChase account.",
    robots: { index: false, follow: true }
  };
}

export default function FavoritesPage() {
  const lang = getServerLang();
  const tools = getAllTools();
  const commentCounts = getCommentsByToolMap();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
          {t(lang, "favPage.badge")}
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
          {t(lang, "favPage.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-500">
          {t(lang, "favPage.subtitle")}
        </p>
      </div>
      <FavoritesClient
        tools={tools}
        commentCounts={commentCounts}
        viewsCounts={getViewsByToolMap()}
      />
    </div>
  );
}
