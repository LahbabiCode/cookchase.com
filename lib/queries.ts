import { getDb } from "./db";
import {
  lastDays,
  buildDailySeries,
  analyzeSeries,
  analyzeToolGrowth,
  growthPct,
  pickFastestGrowing,
  pickRunnersUp,
  type TrafficPoint,
  type ToolTraffic,
  type TrafficData,
  type ToolGrowth
} from "./traffic";
import type { GuideFeedbackStat } from "./guide-feedback";

export interface Tool {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  icon: string;
  description: string;
  how_to_use: string;
  formula: string;
  code: string;
  faq: string;
  tips: string;
  quick_guide: string;
  example_hint: string;
  example_values: string;
  meta_title: string;
  meta_description: string;
  featured: number;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Section {
  key: string;
  title: string;
  subtitle: string;
  content: string;
  badge: string;
  enabled: number;
}

export interface Ad {
  id: number;
  name: string;
  location: string;
  code: string;
  enabled: number;
  sort_order: number;
}

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  meta_title: string;
  meta_description: string;
  published: number;
  created_at: string;
  updated_at: string;
}

export function getSetting(key: string): string {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? "";
}

/** Upsert a single setting (used by the monthly report sender and cron). */
export function setSetting(key: string, value: string) {
  getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .run(key, value);
}

/**
 * Canonical site URL used for sitemap, robots, canonical links and JSON-LD.
 * Priority: SITE_URL env var (production) > site_url admin setting > default.
 */
export function getSiteUrl(): string {
  const fromEnv = (process.env.SITE_URL || "").trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  const fromDb = getSetting("site_url").trim().replace(/\/+$/, "");
  return fromDb || "https://cookchase.com";
}

export function getSettings(): Record<string, string> {
  const rows = getDb()
    .prepare("SELECT key, value FROM settings")
    .all() as { key: string; value: string }[];
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export function getAllTools(): Tool[] {
  return getDb()
    .prepare(
      "SELECT * FROM tools WHERE status = 'active' ORDER BY sort_order ASC, name ASC"
    )
    .all() as Tool[];
}

export function getFeaturedTools(): Tool[] {
  return getDb()
    .prepare(
      "SELECT * FROM tools WHERE status = 'active' AND featured = 1 ORDER BY sort_order ASC"
    )
    .all() as Tool[];
}

export function getToolBySlug(slug: string): Tool | null {
  const row = getDb()
    .prepare("SELECT * FROM tools WHERE slug = ?")
    .get(slug) as Tool | undefined;
  return row ?? null;
}

export function getToolsByCategory(category: string): Tool[] {
  return getDb()
    .prepare(
      "SELECT * FROM tools WHERE status = 'active' AND category = ? ORDER BY sort_order ASC, name ASC"
    )
    .all(category) as Tool[];
}

export function getRelatedTools(tool: Tool, limit = 4): Tool[] {
  const rows = getDb()
    .prepare(
      "SELECT * FROM tools WHERE status = 'active' AND category = ? AND slug != ? ORDER BY sort_order ASC LIMIT ?"
    )
    .all(tool.category, tool.slug, limit) as Tool[];
  if (rows.length >= 3) return rows;
  const extra = getDb()
    .prepare(
      "SELECT * FROM tools WHERE status = 'active' AND slug != ? AND category != ? ORDER BY featured DESC, sort_order ASC LIMIT ?"
    )
    .all(tool.slug, tool.category, limit - rows.length) as Tool[];
  return [...rows, ...extra];
}

export function getToolCategories(): { category: string; count: number }[] {
  return getDb()
    .prepare(
      "SELECT category, COUNT(*) as count FROM tools WHERE status = 'active' GROUP BY category ORDER BY count DESC"
    )
    .all() as { category: string; count: number }[];
}

export function getAllSections(): Section[] {
  return getDb()
    .prepare("SELECT * FROM sections ORDER BY key ASC")
    .all() as Section[];
}

export function getEnabledSections(): Section[] {
  return getDb()
    .prepare("SELECT * FROM sections WHERE enabled = 1 ORDER BY key ASC")
    .all() as Section[];
}

export function getSection(key: string): Section | null {
  const row = getDb()
    .prepare("SELECT * FROM sections WHERE key = ?")
    .get(key) as Section | undefined;
  return row ?? null;
}

export function getFeatureSections(): Section[] {
  const rows = getDb()
    .prepare(
      "SELECT * FROM sections WHERE key LIKE 'feature_%' AND enabled = 1 ORDER BY key ASC"
    )
    .all() as Section[];
  return rows.sort((a, b) => {
    const na = parseInt(a.key.replace("feature_", ""), 10);
    const nb = parseInt(b.key.replace("feature_", ""), 10);
    return na - nb;
  });
}

export interface Page {
  slug: string;
  title: string;
  subtitle: string;
  content: string;
  meta_title: string;
  meta_description: string;
  updated_at: string;
}

export function getPage(slug: string): Page | null {
  const row = getDb()
    .prepare("SELECT * FROM pages WHERE slug = ?")
    .get(slug) as Page | undefined;
  return row ?? null;
}

export interface IngredientDensity {
  id: number;
  name: string;
  g_per_cup: number;
  note: string;
  created_at: string;
}

/**
 * Editable ingredient density table (grams per US cup). Admin can add/update
 * ingredients from the panel; the Grams↔Cups and Measurement→Weight tools
 * read this at runtime so new ingredients appear without touching code.
 */
export function getIngredientDensities(): IngredientDensity[] {
  return getDb()
    .prepare("SELECT * FROM ingredient_densities ORDER BY name ASC")
    .all() as IngredientDensity[];
}

export interface FoodPrice {
  id: number;
  name: string;
  price_per_kg: number;
  note: string;
  created_at: string;
}

/**
 * Editable food price table (avg supermarket USD per kg). Admin can add/update
 * foods from the panel; the Recipe Cost and Recipe Comparator tools read this
 * at runtime so new foods appear without touching code.
 */
export function getFoodPrices(): FoodPrice[] {
  return getDb()
    .prepare("SELECT * FROM food_prices ORDER BY name ASC")
    .all() as FoodPrice[];
}

export function getAdsByLocation(location: string): Ad[] {
  return getDb()
    .prepare(
      "SELECT * FROM ads WHERE location = ? AND enabled = 1 ORDER BY sort_order ASC"
    )
    .all(location) as Ad[];
}

export function getAdsenseClient(): string {
  return getSetting("adsense_client");
}

export function isAdsenseEnabled(): boolean {
  return getSetting("adsense_enabled") === "1";
}

export function getPublishedArticles(): Article[] {
  return getDb()
    .prepare(
      "SELECT * FROM articles WHERE published = 1 ORDER BY created_at DESC"
    )
    .all() as Article[];
}

export function getLatestArticles(limit = 3): Article[] {
  return getDb()
    .prepare(
      "SELECT * FROM articles WHERE published = 1 ORDER BY created_at DESC LIMIT ?"
    )
    .all(limit) as Article[];
}

export function getArticleBySlug(slug: string): Article | null {
  const row = getDb()
    .prepare("SELECT * FROM articles WHERE slug = ? AND published = 1")
    .get(slug) as Article | undefined;
  return row ?? null;
}

export interface SearchResult {
  tools: Tool[];
  articles: Article[];
}

/**
 * Advanced search filters, all backed by shareable URL query params
 * (type, category, sort). type=articles hides tools (and vice versa) so
 * visitors can narrow results without extra round-trips.
 */
export interface SearchFilters {
  type?: "all" | "tools" | "articles";
  category?: string;
  sort?: "relevance" | "popular";
}

/**
 * Case-insensitive keyword search across active tools and published articles.
 * LIKE wildcards in the query are escaped so user input matches literally.
 *
 * Filters:
 *  - type:     restrict the result set to tools, articles, or both
 *  - category: exact-match on the category column of the relevant rows
 *  - sort:     "relevance" (default) or "popular" (all-time views for tools,
 *              approved comment count for articles, which have no view stats)
 */
export function searchAll(
  query: string,
  toolLimit = 8,
  articleLimit = 6,
  filters: SearchFilters = {}
): SearchResult {
  const q = query.trim();
  if (!q) return { tools: [], articles: [] };
  const term = q.replace(/[%_\\]/g, "\\$&");
  const like = `%${term}%`;
  const db = getDb();

  const showTools = filters.type !== "articles";
  const showArticles = filters.type !== "tools";
  const category = (filters.category || "").trim();
  const sortPopular = filters.sort === "popular";

  const tools: Tool[] = [];
  const articles: Article[] = [];

  if (showTools) {
    let sql = `SELECT * FROM tools WHERE status = 'active' AND (
      name LIKE ? ESCAPE '\\' OR tagline LIKE ? ESCAPE '\\' OR
      description LIKE ? ESCAPE '\\' OR category LIKE ? ESCAPE '\\'
    )`;
    const params: (string | number)[] = [like, like, like, like];
    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }
    sql += sortPopular
      ? ` ORDER BY COALESCE((SELECT SUM(views) FROM analytics WHERE analytics.slug = tools.slug), 0) DESC, name ASC LIMIT ?`
      : " ORDER BY sort_order ASC, name ASC LIMIT ?";
    params.push(toolLimit);
    tools.push(...(db.prepare(sql).all(...params) as Tool[]));
  }

  if (showArticles) {
    let sql = `SELECT * FROM articles WHERE published = 1 AND (
      title LIKE ? ESCAPE '\\' OR excerpt LIKE ? ESCAPE '\\' OR
      content LIKE ? ESCAPE '\\'
    )`;
    const params: (string | number)[] = [like, like, like];
    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }
    sql += sortPopular
      ? ` ORDER BY (SELECT COUNT(*) FROM comments c WHERE c.page_type = 'article' AND c.page_slug = articles.slug AND c.approved = 1 AND c.parent_id = 0) DESC, created_at DESC LIMIT ?`
      : " ORDER BY created_at DESC LIMIT ?";
    params.push(articleLimit);
    articles.push(...(db.prepare(sql).all(...params) as Article[]));
  }

  return { tools, articles };
}

/** Published article categories (for the search filter dropdown). */
export function getArticleCategories(): string[] {
  return (
    getDb()
      .prepare(
        "SELECT DISTINCT category FROM articles WHERE published = 1 ORDER BY category ASC"
      )
      .all() as { category: string }[]
  ).map((r) => r.category);
}

export function incrementView(slug: string) {
  const today = new Date().toISOString().slice(0, 10);
  const db = getDb();
  db.prepare(
    `INSERT INTO analytics (slug, views, date) VALUES (?, 1, ?)
     ON CONFLICT(slug, date) DO UPDATE SET views = views + 1`
  ).run(slug, today);
  // NOTE: no per-view alert check here on purpose — this runs on every tool
  // page render, and the full sweep in checkSpikeAlerts() (run when the admin
  // opens the panel) catches every crossing retroactively since analytics
  // rows persist. Keeps the public hot path cheap.
}

/**
 * Article view counter. Stored with a "blog:" prefix so an article and a tool
 * that happen to share a slug never merge their counts in the analytics table
 * (which is keyed on slug alone). The alert sweep strips the prefix back off.
 */
export function incrementArticleView(slug: string) {
  incrementView(`blog:${slug}`);
}

// --- Spike alerts ------------------------------------------------------------

export type AlertPageType = "tool" | "article";

export interface Alert {
  id: number;
  page_type: AlertPageType;
  slug: string;
  display_name: string;
  metric: "views" | "comments";
  value: number;
  threshold: number;
  alert_date: string;
  status: "unread" | "read";
  created_at: string;
}

export interface AlertSettings {
  enabled: boolean;
  // Tools
  viewsThreshold: number;
  commentsThreshold: number;
  // Articles — separate knobs so a quiet blog can warn earlier than tools.
  articleViewsThreshold: number;
  articleCommentsThreshold: number;
}

export function getAlertSettings(): AlertSettings {
  return {
    enabled: getSetting("alerts_enabled") === "1",
    viewsThreshold: parseInt(getSetting("alert_views_threshold") || "200", 10) || 0,
    commentsThreshold: parseInt(getSetting("alert_comments_threshold") || "10", 10) || 0,
    articleViewsThreshold:
      parseInt(getSetting("alert_article_views_threshold") || "100", 10) || 0,
    articleCommentsThreshold:
      parseInt(getSetting("alert_article_comments_threshold") || "5", 10) || 0
  };
}

/** The thresholds that apply to a given page type. */
function thresholdsFor(
  pageType: AlertPageType,
  cfg: AlertSettings
): { views: number; comments: number } {
  return pageType === "article"
    ? { views: cfg.articleViewsThreshold, comments: cfg.articleCommentsThreshold }
    : { views: cfg.viewsThreshold, comments: cfg.commentsThreshold };
}

/** A spike alert that was CREATED by this check (not just refreshed). */
export interface NewAlert {
  pageType: AlertPageType;
  slug: string;
  metric: "views" | "comments";
  value: number;
  threshold: number;
}

/**
 * Insert (or refresh the value of) an alert when a threshold was crossed.
 * The UNIQUE(page_type, slug, metric, alert_date) key means each spike alerts
 * the admin once per day — repeated checks update the displayed count without
 * creating duplicates.
 *
 * Returns the new alert ONLY when this check created a fresh row (the first
 * time a page crosses a metric on a given day). Callers use that to decide
 * whether to email the admin, so a repeated sweep never re-sends an email for
 * the same spike.
 */
function insertAlertIfCrossed(
  pageType: AlertPageType,
  slug: string,
  metric: "views" | "comments",
  value: number,
  threshold: number
): NewAlert | null {
  if (threshold <= 0 || value < threshold) return null;
  const today = new Date().toISOString().slice(0, 10);
  const db = getDb();
  const existing = db
    .prepare(
      "SELECT 1 FROM alerts WHERE page_type = ? AND slug = ? AND metric = ? AND alert_date = ?"
    )
    .get(pageType, slug, metric, today);
  db.prepare(
    `INSERT INTO alerts (page_type, slug, metric, value, threshold, alert_date)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(page_type, slug, metric, alert_date)
     DO UPDATE SET value = excluded.value`
  ).run(pageType, slug, metric, value, threshold, today);
  return existing
    ? null
    : { pageType, slug, metric, value, threshold };
}

/**
 * Check ONE page's current daily totals against the thresholds for its type.
 * Cheap enough to run per-event (e.g. after a comment is posted). Returns the
 * alerts that were newly created, so the caller can email the admin.
 *
 * Views live in the analytics table under the "blog:" prefix for articles;
 * comments are keyed by their page_type column directly.
 */
export function checkAlertForSlug(
  pageType: AlertPageType,
  slug: string
): NewAlert[] {
  const cfg = getAlertSettings();
  if (!cfg.enabled) return [];
  const { views, comments } = thresholdsFor(pageType, cfg);
  if (views <= 0 && comments <= 0) return [];
  const today = new Date().toISOString().slice(0, 10);
  const db = getDb();
  const analyticsSlug = pageType === "article" ? `blog:${slug}` : slug;
  const created: NewAlert[] = [];

  if (views > 0) {
    const v = db
      .prepare("SELECT COALESCE(SUM(views), 0) as total FROM analytics WHERE slug = ? AND date = ?")
      .get(analyticsSlug, today) as { total: number };
    const alert = insertAlertIfCrossed(pageType, slug, "views", v.total, views);
    if (alert) created.push(alert);
  }

  if (comments > 0) {
    const c = db
      .prepare(
        `SELECT COUNT(*) as total FROM comments
         WHERE page_type = ? AND page_slug = ? AND parent_id = 0
           AND date(created_at) = ?`
      )
      .get(pageType, slug, today) as { total: number };
    const alert = insertAlertIfCrossed(pageType, slug, "comments", c.total, comments);
    if (alert) created.push(alert);
  }

  return created;
}

/**
 * Full sweep: check every tool AND article that has views or comments today.
 * Called when the admin opens the panel so threshold changes or missed checks
 * catch up. Settings are read ONCE here (not per slug) to keep it light.
 * Returns all alerts newly created by this sweep (for emailing the admin).
 */
export function checkSpikeAlerts(): NewAlert[] {
  const cfg = getAlertSettings();
  if (!cfg.enabled) return [];
  const today = new Date().toISOString().slice(0, 10);
  const db = getDb();
  const created: NewAlert[] = [];

  // Tools: plain analytics slugs; comments with page_type = 'tool'.
  created.push(
    ...sweepPageType(
      "tool",
      db
        .prepare("SELECT DISTINCT slug FROM analytics WHERE date = ? AND slug NOT LIKE 'blog:%'")
        .all(today) as { slug: string }[],
      db
        .prepare(
          `SELECT page_slug as slug, COUNT(*) as total FROM comments
           WHERE page_type = 'tool' AND parent_id = 0 AND date(created_at) = ?
           GROUP BY page_slug`
        )
        .all(today) as { slug: string; total: number }[],
      cfg
    )
  );

  // Articles: analytics rows carry the "blog:" prefix — strip it back off.
  const articleViewSlugs = db
    .prepare(
      `SELECT DISTINCT substr(slug, 6) as slug FROM analytics
       WHERE date = ? AND slug LIKE 'blog:%'`
    )
    .all(today) as { slug: string }[];
  const articleComments = db
    .prepare(
      `SELECT page_slug as slug, COUNT(*) as total FROM comments
       WHERE page_type = 'article' AND parent_id = 0 AND date(created_at) = ?
       GROUP BY page_slug`
    )
    .all(today) as { slug: string; total: number }[];
  created.push(
    ...sweepPageType("article", articleViewSlugs, articleComments, cfg)
  );

  return created;
}

/**
 * Shared sweep body: cross every activity-bearing slug for a page type against
 * that type's thresholds, using the maps of today's totals.
 */
function sweepPageType(
  pageType: AlertPageType,
  viewSlugs: { slug: string }[],
  commentTotals: { slug: string; total: number }[],
  cfg: AlertSettings
): NewAlert[] {
  const { views, comments } = thresholdsFor(pageType, cfg);
  if (views <= 0 && comments <= 0) return [];
  const today = new Date().toISOString().slice(0, 10);
  const db = getDb();
  const slugs = new Set<string>(viewSlugs.map((r) => r.slug));
  for (const r of commentTotals) slugs.add(r.slug);

  const viewsBySlug = new Map<string, number>(
    (
      db
        .prepare(
          pageType === "article"
            ? `SELECT substr(slug, 6) as slug, SUM(views) as total FROM analytics
               WHERE date = ? AND slug LIKE 'blog:%' GROUP BY substr(slug, 6)`
            : `SELECT slug, SUM(views) as total FROM analytics
               WHERE date = ? AND slug NOT LIKE 'blog:%' GROUP BY slug`
        )
        .all(today) as { slug: string; total: number }[]
    ).map((r) => [r.slug, r.total])
  );
  const commentsBySlug = new Map(commentTotals.map((r) => [r.slug, r.total]));
  const created: NewAlert[] = [];

  for (const slug of Array.from(slugs)) {
    const v = insertAlertIfCrossed(pageType, slug, "views", viewsBySlug.get(slug) ?? 0, views);
    if (v) created.push(v);
    const c = insertAlertIfCrossed(pageType, slug, "comments", commentsBySlug.get(slug) ?? 0, comments);
    if (c) created.push(c);
  }

  return created;
}

/** Remove read alerts older than `days` to keep the table from growing forever. */
export function pruneOldAlerts(days = 30) {
  getDb()
    .prepare(
      "DELETE FROM alerts WHERE status = 'read' AND alert_date < date('now', ?)"
    )
    .run(`-${days} days`);
}

export function getAlerts(limit = 50): Alert[] {
  return getDb()
    .prepare(
      `SELECT a.*, COALESCE(t.name, ar.title, a.slug) as display_name
       FROM alerts a
       LEFT JOIN tools t ON t.slug = a.slug AND a.page_type = 'tool'
       LEFT JOIN articles ar ON ar.slug = a.slug AND a.page_type = 'article'
       ORDER BY a.status = 'unread' DESC, a.alert_date DESC, a.id DESC
       LIMIT ?`
    )
    .all(limit) as Alert[];
}

export function getUnreadAlertCount(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) as c FROM alerts WHERE status = 'unread'")
    .get() as { c: number };
  return row.c;
}

export function markAlertRead(id: number) {
  getDb().prepare("UPDATE alerts SET status = 'read' WHERE id = ?").run(id);
}

export function markAllAlertsRead() {
  getDb().prepare("UPDATE alerts SET status = 'read' WHERE status = 'unread'").run();
}

// NOTE: these two are deliberately SITE-WIDE totals — they include article
// views (stored under the 'blog:' prefix) alongside tool views, because the
// dashboard labels them "Views today" / "Views all-time" (whole-site traffic).
// The tool-focused queries (getViewsByTool, the admin report) exclude the
// 'blog:' prefix on purpose. Keep that split explicit if you change either.
export function getViewsToday(): number {
  const today = new Date().toISOString().slice(0, 10);
  const row = getDb()
    .prepare("SELECT COALESCE(SUM(views), 0) as total FROM analytics WHERE date = ?")
    .get(today) as { total: number };
  return row.total;
}

export function getViewsAllTime(): number {
  const row = getDb()
    .prepare("SELECT COALESCE(SUM(views), 0) as total FROM analytics")
    .get() as { total: number };
  return row.total;
}

export function getViewsByTool(): { slug: string; views: number }[] {
  // Article views live under the "blog:" prefix in the same table — exclude
  // them so the dashboard's "most viewed tools" stays tool-only.
  return getDb()
    .prepare(
      "SELECT slug, SUM(views) as views FROM analytics WHERE slug NOT LIKE 'blog:%' GROUP BY slug ORDER BY views DESC"
    )
    .all() as { slug: string; views: number }[];
}

/**
 * Slug → all-time view count map for every tool, so card grids can show a
 * per-tool views badge without per-card queries. Excludes article views
 * ("blog:" prefix), consistent with getViewsByTool().
 */
export function getViewsByToolMap(): Record<string, number> {
  const rows = getViewsByTool();
  const out: Record<string, number> = {};
  for (const r of rows) out[r.slug] = r.views;
  return out;
}

export interface Comment {
  id: number;
  page_type: string;
  page_slug: string;
  name: string;
  email?: string;
  message: string;
  approved: number;
  parent_id: number;
  is_admin: number;
  likes: number;
  created_at: string;
}

/**
 * Depth of a comment in the reply chain. A top-level comment is depth 1,
 * its replies depth 2, and so on. Guards the 3-level nesting limit so a
 * visitor can never bury a thread deeper than the UI can render.
 */
export function getCommentDepth(id: number): number {
  if (!id) return 0;
  const db = getDb();
  let depth = 0;
  let current = id;
  const seen = new Set<number>();
  while (current > 0 && !seen.has(current)) {
    seen.add(current);
    depth++;
    const row = db
      .prepare("SELECT parent_id FROM comments WHERE id = ?")
      .get(current) as { parent_id: number } | undefined;
    if (!row) break;
    current = row.parent_id;
  }
  return depth;
}

/**
 * Approved comments for a page, assembled into a nested reply tree.
 * Top-level comments are newest-first; replies hang off their parent with the
 * same tree shape, so the frontend can render them indented.
 *
 * NOTE: the commenter's email is deliberately NOT selected — it is private
 * notification data and must never leak through the public API.
 */
export function getApprovedComments(
  pageType: string,
  pageSlug: string
): Comment[] {
  // DESC so the LIMIT keeps the NEWEST 200 comments (the tree builder then
  // re-sorts each level newest-first for display).
  const rows = getDb()
    .prepare(
      `SELECT id, page_type, page_slug, name, message, approved, parent_id, is_admin, likes, created_at
       FROM comments WHERE page_type = ? AND page_slug = ? AND approved = 1
       ORDER BY created_at DESC LIMIT 200`
    )
    .all(pageType, pageSlug) as Comment[];
  return buildCommentTree(rows);
}

/** Build a nested comment tree from flat DB rows. Replies (parent_id > 0) are
 * attached to their parent; orphans are kept as top-level comments. */
function buildCommentTree(rows: Comment[]): Comment[] {
  const byId = new Map<number, Comment & { replies: Comment[] }>();
  for (const row of rows) {
    byId.set(row.id, { ...row, replies: [] });
  }
  const roots: (Comment & { replies: Comment[] })[] = [];
  for (const node of Array.from(byId.values())) {
    const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
    if (parent && parent.id !== node.id) {
      parent.replies.push(node);
    } else {
      roots.push(node);
    }
  }
  // Newest first at each level; id breaks ties when two comments share the
  // same second (SQLite created_at precision) so the order is always stable.
  const newestFirst = (a: Comment, b: Comment) =>
    b.created_at.localeCompare(a.created_at) || b.id - a.id;
  roots.sort(newestFirst);
  for (const node of Array.from(byId.values())) node.replies.sort(newestFirst);
  return roots as Comment[];
}

export function getPendingCommentCount(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) as c FROM comments WHERE approved = 0")
    .get() as { c: number };
  return row.c;
}

export function getApprovedCommentCount(): number {
  // Visitor comments only — admin replies don't inflate the engagement stats.
  const row = getDb()
    .prepare("SELECT COUNT(*) as c FROM comments WHERE approved = 1 AND parent_id = 0")
    .get() as { c: number };
  return row.c;
}

export function getCommentsByTool(): { slug: string; comments: number }[] {
  return getDb()
    .prepare(
      `SELECT page_slug as slug, COUNT(*) as comments
       FROM comments
       WHERE page_type = 'tool' AND approved = 1 AND parent_id = 0
       GROUP BY page_slug
       ORDER BY comments DESC`
    )
    .all() as { slug: string; comments: number }[];
}

/**
 * Slug → approved comment count map for every tool, so card grids can show
 * a per-tool engagement badge without per-card queries.
 */
export function getCommentsByToolMap(): Record<string, number> {
  const rows = getCommentsByTool();
  const out: Record<string, number> = {};
  for (const r of rows) out[r.slug] = r.comments;
  return out;
}

export interface EngagementStat {
  slug: string;
  views: number;
  comments: number;
  score: number;
}

/**
 * Most-engaged tools ranked by a combined interaction score.
 * A comment is worth 25 views (comments take more effort than a page view).
 */
export function getMostEngagedTools(limit = 5): EngagementStat[] {
  const viewsMap = new Map<string, number>(
    getViewsByTool().map((v) => [v.slug, v.views])
  );
  const commentsMap = new Map<string, number>(
    getCommentsByTool().map((c) => [c.slug, c.comments])
  );
  const slugs = new Set([
    ...Array.from(viewsMap.keys()),
    ...Array.from(commentsMap.keys())
  ]);
  return Array.from(slugs)
    .map((slug) => {
      const views = viewsMap.get(slug) ?? 0;
      const comments = commentsMap.get(slug) ?? 0;
      return { slug, views, comments, score: views + comments * 25 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// --- Guide feedback ("Was this guide helpful?") ----------------------------

/**
 * Per-tool aggregates from the guide_feedback table, joined with the tools
 * table for display names. Only tools that have received at least one vote
 * appear; the admin panel ranks them by helpfulness % to spot the guides
 * that need a rewrite.
 */
export function getGuideFeedbackStats(): GuideFeedbackStat[] {
  const rows = getDb()
    .prepare(
      `SELECT f.tool_slug as slug, COALESCE(t.name, f.tool_slug) as name,
              SUM(CASE WHEN f.helpful = 1 THEN 1 ELSE 0 END) as helpful,
              SUM(CASE WHEN f.helpful = 0 THEN 1 ELSE 0 END) as notHelpful,
              COUNT(*) as total
       FROM guide_feedback f
       LEFT JOIN tools t ON t.slug = f.tool_slug
       GROUP BY f.tool_slug
       HAVING total > 0
       ORDER BY total DESC, slug ASC`
    )
    .all() as { slug: string; name: string; helpful: number; notHelpful: number; total: number }[];
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    helpful: Number(r.helpful),
    notHelpful: Number(r.notHelpful),
    total: Number(r.total)
  }));
}

/** Total guide-feedback votes across all tools (dashboard summary). */
export function getGuideFeedbackTotal(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) as c FROM guide_feedback")
    .get() as { c: number };
  return row.c;
}

// --- Traffic analytics (admin chart) ---------------------------------------

/**
 * Build the full traffic dataset for the admin analytics page.
 *
 * Views are read from the analytics table (slug, date, views). Article views
 * live under the "blog:" prefix in the same table — they're excluded here so
 * the tool chart stays tool-focused, consistent with getViewsByTool() and the
 * admin report. The daily-series math is pure (lib/traffic.ts, unit-tested).
 *
 * SPIKE SEMANTICS: spike days are recomputed from analytics against the
 * CURRENT views threshold (Settings → Spike alerts), not read from the alerts
 * table. The alerts table only covers days the sweep ran and reflects the
 * threshold at that time; recomputing is complete and deterministic. Changing
 * the threshold retroactively changes historical spike markers — deliberate.
 */
export function buildTrafficData(days = 30): TrafficData {
  const db = getDb();
  const dates = lastDays(days);
  const start = dates[0];
  const end = dates[dates.length - 1];

  const tools = db
    .prepare(
      "SELECT slug, name, category FROM tools WHERE status = 'active' ORDER BY sort_order ASC, name ASC"
    )
    .all() as { slug: string; name: string; category: string }[];

  const rows = db
    .prepare(
      "SELECT slug, date, views FROM analytics WHERE date >= ? AND date <= ? AND slug NOT LIKE 'blog:%'"
    )
    .all(start, end) as { slug: string; date: string; views: number }[];

  const bySlug = new Map<string, { date: string; views: number }[]>();
  for (const r of rows) {
    const list = bySlug.get(r.slug) || [];
    list.push(r);
    bySlug.set(r.slug, list);
  }

  const viewsThreshold = getAlertSettings().viewsThreshold;

  const toolList: ToolTraffic[] = tools.map((t) => {
    const series = buildDailySeries(bySlug.get(t.slug) || [], days);
    const stats = analyzeSeries(series, viewsThreshold);
    return {
      slug: t.slug,
      name: t.name,
      category: t.category,
      total: stats.total,
      avg: stats.avg,
      peak: stats.peak,
      peakDate: stats.peakDate,
      spikeDates: stats.spikeDates,
      series
    };
  });

  // Most-viewed tools first so the chart defaults to the most interesting one.
  toolList.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  const siteSeries: TrafficPoint[] = buildDailySeries(rows, days);
  const siteTotal = siteSeries.reduce((s, p) => s + p.views, 0);

  return {
    days,
    startDate: start,
    endDate: end,
    siteTotal,
    siteSeries,
    tools: toolList,
    viewsThreshold
  };
}

export interface ToolOfTheDay {
  winner: ToolGrowth | null;
  runnersUp: ToolGrowth[];
  asOf: string; // YYYY-MM-DD
  siteToday: number;
  siteYesterday: number;
  siteLastWeek: number;
  siteDayGrowthPct: number | null;
  siteWeekGrowthPct: number | null;
}

/**
 * "Tool of the day" — compares TODAY's views against yesterday (day-over-day)
 * and against the same day last week (the anniversary comparison), then picks
 * the fastest-growing tool for the dashboard highlight. Reuses the 8-day
 * traffic snapshot (today + 7 previous days is enough for both baselines).
 */
export function getToolOfTheDay(): ToolOfTheDay {
  const data = buildTrafficData(8);
  const stats: ToolGrowth[] = data.tools.map((t) =>
    analyzeToolGrowth(t.series, { slug: t.slug, name: t.name, category: t.category })
  );
  const winner = pickFastestGrowing(stats);
  const runnersUp = pickRunnersUp(stats, winner?.slug ?? null);

  const siteSeries = data.siteSeries;
  const n = siteSeries.length;
  const siteToday = n > 0 ? siteSeries[n - 1].views : 0;
  const siteYesterday = n > 1 ? siteSeries[n - 2].views : 0;
  const siteLastWeek = n > 7 ? siteSeries[n - 8].views : 0;

  return {
    winner,
    runnersUp,
    asOf: data.endDate,
    siteToday,
    siteYesterday,
    siteLastWeek,
    siteDayGrowthPct: growthPct(siteToday, siteYesterday),
    siteWeekGrowthPct: growthPct(siteToday, siteLastWeek)
  };
}
