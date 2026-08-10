"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";
import { useLang } from "@/lib/useLang";

export default function FavButton({
  slug,
  size = "sm",
  className = ""
}: {
  slug: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const { ready, isFavorite, toggle } = useFavorites();
  const { t } = useLang();
  const fav = ready && isFavorite(slug);

  const sizes =
    size === "md"
      ? "h-10 w-10 rounded-lg border"
      : "h-8 w-8 rounded-md";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      aria-label={fav ? t("fav.remove") : t("fav.save")}
      aria-pressed={fav}
      title={fav ? t("fav.saved") : t("fav.save")}
      className={`inline-flex items-center justify-center transition ${
        fav
          ? "border-red-200 bg-red-50 text-red-500"
          : "border-ink-200 bg-white text-ink-400 hover:border-red-300 hover:text-red-400"
      } ${sizes} ${className}`}
    >
      <Heart
        className={`h-4 w-4 transition-transform ${
          fav ? "scale-110 fill-red-500 text-red-500" : ""
        }`}
      />
    </button>
  );
}
