import type { MetadataRoute } from "next";
import { getSetting } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default function manifest(): MetadataRoute.Manifest {
  const name = getSetting("site_name") || "CookChase";
  return {
    name,
    short_name: "CookChase",
    description:
      "Free cooking tools, calculators and kitchen guides for home cooks.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f4ed",
    theme_color: "#2c6349",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
