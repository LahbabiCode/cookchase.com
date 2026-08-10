import { NextResponse } from "next/server";
import { searchAll } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
  if (!q) return NextResponse.json({ tools: [], articles: [] });

  const { tools, articles } = searchAll(q, 6, 4);

  return NextResponse.json({
    tools: tools.map((t) => ({
      slug: t.slug,
      name: t.name,
      category: t.category,
      icon: t.icon,
      tagline: t.tagline
    })),
    articles: articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      excerpt: a.excerpt
    }))
  });
}
