import { getSiteUrl } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default function robots() {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/search"]
      }
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base.replace(/^https?:\/\//, "")
  };
}
