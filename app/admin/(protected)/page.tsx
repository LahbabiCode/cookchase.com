import Link from "next/link";
import {
  getDb
} from "@/lib/db";import { getViewsToday,
  getViewsAllTime,
  getViewsByTool,
  getPendingCommentCount,
  getApprovedCommentCount,
  getMostEngagedTools,
  getToolOfTheDay
} from "@/lib/queries";
import AlertsPanel from "@/components/admin/AlertsPanel";
import ReportExporter from "@/components/admin/ReportExporter";
import ToolOfTheDay from "@/components/admin/ToolOfTheDay";
import GuideFeedbackPanel from "@/components/admin/GuideFeedbackPanel";
import {
  ArrowRight,
  Eye,
  Wrench,
  FileText,
  Newspaper,
  LayoutGrid,
  MessageSquare,
  HeartHandshake,
  MessageCircle,
  Flame
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const db = getDb();
  const toolCount = (db.prepare("SELECT COUNT(*) as c FROM tools").get() as { c: number }).c;
  const activeTools = (
    db.prepare("SELECT COUNT(*) as c FROM tools WHERE status = 'active'").get() as { c: number }
  ).c;
  const pageCount = (db.prepare("SELECT COUNT(*) as c FROM pages").get() as { c: number }).c;
  const sectionCount = (db.prepare("SELECT COUNT(*) as c FROM sections").get() as { c: number }).c;
  const articleCount = (db.prepare("SELECT COUNT(*) as c FROM articles").get() as { c: number }).c;
  const viewsToday = getViewsToday();
  const viewsAll = getViewsAllTime();
  const topTools = getViewsByTool().slice(0, 5);
  const pendingComments = getPendingCommentCount();
  const approvedComments = getApprovedCommentCount();
  const engagedTools = getMostEngagedTools(5);
  const toolOfTheDay = getToolOfTheDay();

  const stats = [
    { label: "Tools", value: String(toolCount), sub: `${activeTools} active`, href: "/admin/tools", Icon: Wrench },
    { label: "Homepage sections", value: String(sectionCount), sub: "editable blocks", href: "/admin/sections", Icon: LayoutGrid },
    { label: "Pages", value: String(pageCount), sub: "about · privacy · terms", href: "/admin/pages", Icon: FileText },
    { label: "Articles", value: String(articleCount), sub: "blog posts", href: "/admin/articles", Icon: Newspaper }
  ];

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-500">
            Overview of your site&apos;s content and performance.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-xl border border-ink-200 bg-white p-5 shadow-card transition hover:border-brand-300 hover:shadow-lift"
          >
            <div className="flex items-center justify-between">
              <s.Icon className="h-4 w-4 text-ink-400" />
              <ArrowRight className="h-3.5 w-3.5 text-ink-300 transition group-hover:text-brand-500" />
            </div>
            <p className="mt-3 text-2xl font-bold text-ink-900">{s.value}</p>
            <p className="text-sm font-medium text-ink-600">{s.label}</p>
            <p className="text-xs text-ink-400">{s.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <ToolOfTheDay data={toolOfTheDay} />
      </div>

      <div className="mt-6">
        <GuideFeedbackPanel />
      </div>

      <div className="mt-6">
        <ReportExporter />
      </div>

      <div className="mt-6">
        <AlertsPanel />
      </div>

      {pendingComments > 0 && (
        <Link
          href="/admin/comments"
          className="mt-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 transition hover:border-amber-300"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {pendingComments} comment{pendingComments === 1 ? "" : "s"} awaiting moderation
            </p>
            <p className="text-xs text-amber-700">
              Approve or delete them before they appear on the site.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-600" />
        </Link>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <Eye className="h-4 w-4 text-brand-600" />
            Traffic snapshot
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-ink-50 p-4">
              <p className="text-2xl font-bold text-ink-900">{viewsToday.toLocaleString()}</p>
              <p className="text-xs text-ink-500">Views today</p>
            </div>
            <div className="rounded-lg bg-ink-50 p-4">
              <p className="text-2xl font-bold text-ink-900">{viewsAll.toLocaleString()}</p>
              <p className="text-xs text-ink-500">Views all-time</p>
            </div>
          </div>
          {topTools.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Most viewed tools
              </p>
              <div className="mt-2 space-y-2">
                {topTools.map((t, i) => (
                  <div key={t.slug} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-ink-700">
                      <span className="w-4 text-xs font-semibold text-ink-400">{i + 1}</span>
                      {t.slug.replace(/-/g, " ")}
                    </span>
                    <span className="font-semibold text-ink-900">{t.views}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <HeartHandshake className="h-4 w-4 text-pink-600" />
            Engagement snapshot
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-pink-50 p-4">
              <p className="text-2xl font-bold text-ink-900">{approvedComments.toLocaleString()}</p>
              <p className="text-xs text-ink-500">Approved comments</p>
            </div>
            <div className="rounded-lg bg-pink-50 p-4">
              <p className="text-2xl font-bold text-ink-900">{pendingComments}</p>
              <p className="text-xs text-ink-500">Awaiting moderation</p>
            </div>
          </div>
          {engagedTools.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Most engaging tools
              </p>
              <div className="mt-2 space-y-2">
                {engagedTools.map((t, i) => (
                  <div key={t.slug} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2 text-ink-700">
                      <span className="w-4 shrink-0 text-xs font-semibold text-ink-400">{i + 1}</span>
                      <span className="truncate">{t.slug.replace(/-/g, " ")}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                        <Eye className="h-3 w-3" />
                        {t.views}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-pink-600">
                        <MessageCircle className="h-3 w-3" />
                        {t.comments}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 flex items-center gap-1 text-[11px] text-ink-400">
                <Flame className="h-3 w-3 text-amber-500" />
                Ranked by views + comments (a comment counts 25× a view)
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-ink-900">Quick actions</h2>
          <div className="mt-4 space-y-2">
            <Link
              href="/admin/stats"
              className="flex items-center justify-between rounded-lg border border-ink-200 px-4 py-3 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              View traffic analytics
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/tools"
              className="flex items-center justify-between rounded-lg border border-ink-200 px-4 py-3 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              Edit a tool&apos;s content
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/sections"
              className="flex items-center justify-between rounded-lg border border-ink-200 px-4 py-3 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              Update homepage text
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/ads"
              className="flex items-center justify-between rounded-lg border border-ink-200 px-4 py-3 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              Configure AdSense slots
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center justify-between rounded-lg border border-ink-200 px-4 py-3 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              Site-wide settings & SEO
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin/deploy"
              className="flex items-center justify-between rounded-lg border border-ink-200 px-4 py-3 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              Deploy the site
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
