import { getAllTools, getPublishedArticles, getSiteUrl } from "@/lib/queries";
import { getAllHubSlugs } from "@/lib/category-hubs";

export const dynamic = "force-dynamic";

export default function sitemap() {
  const base = getSiteUrl();
  const now = new Date().toISOString();

  const staticRoutes = [
    "",
    "/tools",
    "/favorites",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/blog"
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.8
  }));

  const hubRoutes = getAllHubSlugs().map((slug) => ({
    url: `${base}/tools/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75
  }));

  let toolRoutes: { url: string; lastModified: string; changeFrequency: string; priority: number }[] = [];
  let articleRoutes: { url: string; lastModified: string; changeFrequency: string; priority: number }[] = [];
  try {
    toolRoutes = getAllTools().map((t) => ({
      url: `${base}/tools/${t.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9
    }));
    articleRoutes = getPublishedArticles().map((a) => ({
      url: `${base}/blog/${a.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7
    }));
  } catch {
    /* DB not ready */
  }

  return [...staticRoutes, ...hubRoutes, ...toolRoutes, ...articleRoutes];
}
