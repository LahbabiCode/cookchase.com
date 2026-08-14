import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { seedDatabase } from "./seed";
import { toolsSeed, siteSettingsSeed } from "./seed-data";
import { QUICK_GUIDES, parseQuickGuide, serializeQuickGuide } from "./quick-guides";
import {
  TOOL_EXAMPLES,
  serializeToolExampleValues
} from "./tool-examples";
import { DENSITIES } from "../components/tools/densities";
import { FOOD_PRICES } from "../components/tools/foodPrices";

// Database location is configurable so the app can be deployed anywhere:
//   DATABASE_PATH  -> full path to the SQLite file (highest priority)
//   DATA_DIR       -> directory where cookchase.db lives (defaults to ./data)
const dataDir =
  process.env.DATA_DIR || path.join(process.cwd(), "data");
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, "cookchase.db");
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    // `next build` collects page data in parallel worker processes, so several
    // of them open this file at once. Without a busy timeout the pragmas below
    // fail immediately with SQLITE_BUSY ("database is locked"); with one they
    // wait for the writer to finish. It also protects concurrent requests.
    db.pragma("busy_timeout = 15000");
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
    seedIfEmpty(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      tagline TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'Calculators',
      icon TEXT NOT NULL DEFAULT 'Calculator',
      description TEXT NOT NULL DEFAULT '',
      how_to_use TEXT NOT NULL DEFAULT '',
      formula TEXT NOT NULL DEFAULT '',
      code TEXT NOT NULL DEFAULT '',
      faq TEXT NOT NULL DEFAULT '',
      tips TEXT NOT NULL DEFAULT '',
      quick_guide TEXT NOT NULL DEFAULT '',
      example_hint TEXT NOT NULL DEFAULT '',
      example_values TEXT NOT NULL DEFAULT '',
      meta_title TEXT NOT NULL DEFAULT '',
      meta_description TEXT NOT NULL DEFAULT '',
      featured INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pages (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      subtitle TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      meta_title TEXT NOT NULL DEFAULT '',
      meta_description TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sections (
      key TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      subtitle TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      badge TEXT NOT NULL DEFAULT '',
      enabled INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      code TEXT NOT NULL DEFAULT '',
      enabled INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL,
      views INTEGER NOT NULL DEFAULT 1,
      date TEXT NOT NULL,
      UNIQUE(slug, date)
    );
    -- Date-range scans: admin stats chart (last 7-90 days), dashboard "views
    -- today", the admin report and the spike-alert sweep all filter on date.
    -- The UNIQUE(slug, date) index can't serve those, so this keeps them fast.
    CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics (date);

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'Tips',
      meta_title TEXT NOT NULL DEFAULT '',
      meta_description TEXT NOT NULL DEFAULT '',
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_type TEXT NOT NULL DEFAULT 'tool',
      page_slug TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      approved INTEGER NOT NULL DEFAULT 0,
      parent_id INTEGER NOT NULL DEFAULT 0,
      is_admin INTEGER NOT NULL DEFAULT 0,
      likes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_comments_page ON comments (page_type, page_slug);
    -- Speeds up the per-tool approved-comment counts shown on tool cards
    -- (queried on every tool page render + homepage/tools grids).
    CREATE INDEX IF NOT EXISTS idx_comments_approval ON comments (page_type, approved, parent_id);

    -- Visitor accounts: email + password, syncs favorites across devices.
    -- Kept separate from the admin users table.
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS account_sessions (
      token TEXT PRIMARY KEY,
      account_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_account_sessions_user ON account_sessions (account_id);

    CREATE TABLE IF NOT EXISTS account_favorites (
      account_id INTEGER NOT NULL,
      slug TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (account_id, slug)
    );

    -- Spike alerts: a tool OR article crossed a daily views/comments threshold.
    -- One row per (page_type, slug, metric, day) so each spike alerts the admin
    -- once, and a tool and an article that share a slug never collide.
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_type TEXT NOT NULL DEFAULT 'tool',  -- 'tool' | 'article'
      slug TEXT NOT NULL,
      metric TEXT NOT NULL,          -- 'views' | 'comments'
      value INTEGER NOT NULL DEFAULT 0,
      threshold INTEGER NOT NULL DEFAULT 0,
      alert_date TEXT NOT NULL,      -- YYYY-MM-DD of the spike
      status TEXT NOT NULL DEFAULT 'unread',  -- 'unread' | 'read'
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(page_type, slug, metric, alert_date)
    );

    -- Contact form submissions — stored so admin can review them even if
    -- the email notification is off or SMTP is misconfigured.
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages (created_at);

    -- Ingredient densities (grams per US cup) shared by the Grams↔Cups and
    -- Measurement→Weight tools. Editable from the admin panel so new
    -- ingredients can be added without touching code.
    CREATE TABLE IF NOT EXISTS ingredient_densities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      g_per_cup REAL NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Food prices (avg supermarket USD per kg) used by the Recipe Cost and
    -- Recipe Comparator tools to estimate cost when the visitor leaves a
    -- price blank. Editable from the admin panel like ingredient densities.
    CREATE TABLE IF NOT EXISTS food_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      price_per_kg REAL NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- "Was this guide helpful?" votes, collected under every tool's Quick
    -- guide so the admin can see which tools need better explanations. One
    -- row per vote; the client dedupes per visitor via localStorage and the
    -- API rate-limits per IP.
    CREATE TABLE IF NOT EXISTS guide_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_slug TEXT NOT NULL,
      helpful INTEGER NOT NULL DEFAULT 0,   -- 1 = helpful, 0 = not helpful
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_guide_feedback_tool ON guide_feedback (tool_slug);

    -- Saved tool results ("result history"). One row per saved calculation;
    -- the rows column stores the label/value snapshot as JSON. Free for every
    -- signed-in account. The client keeps a shared store
    -- (lib/useResultHistory.ts) so the list stays in sync across tabs.
    CREATE TABLE IF NOT EXISTS result_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      tool_slug TEXT NOT NULL DEFAULT '',
      tool_name TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL DEFAULT '',
      rows TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_result_history_account ON result_history (account_id);

    -- One-time password reset tokens. A single-use link per account; the
    -- token expires after an hour and is marked used on consumption so a
    -- captured link can never be replayed.
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_password_resets_account ON password_resets (account_id);

    -- Per-account user preferences that sync across devices with the same
    -- account system used for favorites: measurement units, language and the
    -- accessibility "Easy Mode" toggle (plus its dark high-contrast
    -- sub-option, easy_contrast). One row per account; defaults match
    -- the public DEFAULT_SETTINGS in lib/settings-utils.ts.
    CREATE TABLE IF NOT EXISTS account_settings (
      account_id INTEGER PRIMARY KEY,
      units TEXT NOT NULL DEFAULT 'metric',
      language TEXT NOT NULL DEFAULT 'en',
      easy_mode INTEGER NOT NULL DEFAULT 0,
      compact_mode INTEGER NOT NULL DEFAULT 0,
      easy_contrast INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Deploy runs triggered from the admin panel: each row is one invocation
    -- of deploy.sh (or an in-process health check), so the admin can see what
    -- happened, when, and whether verification passed — without leaving the
    -- browser. The heavy deploy itself runs in a detached background process
    -- (scripts/run-deploy.js) that writes the finished result back here.
    CREATE TABLE IF NOT EXISTS deployments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      env TEXT NOT NULL DEFAULT '',            -- '' | 'staging' | 'prod' | 'pipeline'
      action TEXT NOT NULL DEFAULT 'deploy',   -- 'deploy' | 'check'
      status TEXT NOT NULL DEFAULT 'running',  -- 'running' | 'success' | 'failed'
      http_code TEXT NOT NULL DEFAULT '',
      exit_code INTEGER NOT NULL DEFAULT -1,
      log_tail TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL DEFAULT '',
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      finished_at TEXT NOT NULL DEFAULT '',
      duration_ms INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_deployments_started ON deployments (started_at DESC);
  `);
  migrateCommentColumns(db);
  migrateAccountSessionColumns(db);
  migrateAlertColumns(db);
  migrateQuickGuideColumn(db);
  migrateQuickGuideExamples(db);
  migrateToolExamples(db);
  migrateAccountSettingsColumns(db);
  seedIngredientDensities(db);
  seedFoodPrices(db);
}

/**
 * Idempotent migration for databases created before the Quick Guide became
 * admin-editable: adds the tools.quick_guide column, then backfills the 31
 * built-in tools with the 3-step guides they previously hardcoded in their
 * widgets (the QUICK_GUIDES map was extracted verbatim from those widgets).
 * Admin-created tools (slugs not in the map) stay empty until the admin
 * fills the editor field.
 */
function migrateQuickGuideColumn(db: Database.Database) {
  const cols = (db.prepare("PRAGMA table_info(tools)").all() as { name: string }[]).map(
    (c) => c.name
  );
  if (!cols.includes("quick_guide")) {
    db.prepare("ALTER TABLE tools ADD COLUMN quick_guide TEXT NOT NULL DEFAULT ''").run();
  }
  const update = db.prepare("UPDATE tools SET quick_guide = ? WHERE slug = ? AND quick_guide = ''");
  const tx = db.transaction(() => {
    for (const [slug, steps] of Object.entries(QUICK_GUIDES)) {
      update.run(serializeQuickGuide(steps), slug);
    }
  });
  tx();
}

/**
 * Idempotent migration for databases created before guide steps carried a
 * numeric example: fills in the default example for any built-in tool step
 * that doesn't have one yet. Only touches the example field — admin edits to
 * titles/texts are preserved, and an example the admin already typed is
 * never overwritten.
 *
 * Note on cleared examples: an admin who deliberately empties a field gets
 * the default back on the next restart. That's unavoidable — serialize omits
 * empty examples from the stored JSON entirely, so a cleared example and a
 * never-set example are indistinguishable in the database.
 */
function migrateQuickGuideExamples(db: Database.Database) {
  const rows = db
    .prepare("SELECT slug, quick_guide FROM tools")
    .all() as { slug: string; quick_guide: string }[];
  const update = db.prepare("UPDATE tools SET quick_guide = ? WHERE slug = ?");
  let changed = 0;
  for (const row of rows) {
    const defaults = QUICK_GUIDES[row.slug];
    if (!defaults || defaults.length === 0) continue; // admin-created tool
    const steps = parseQuickGuide(row.quick_guide);
    if (steps.length !== defaults.length) continue; // shape mismatch — leave alone
    let dirty = false;
    const merged = steps.map((s, i) => {
      const d = defaults[i];
      if (d && !s.example) {
        dirty = true;
        return { ...s, example: d.example ?? "" };
      }
      return s;
    });
    if (dirty) {
      update.run(serializeQuickGuide(merged), row.slug);
      changed++;
    }
  }
  if (changed > 0) {
    console.log(`[migrate] added guide examples to ${changed} tool(s)`);
  }
}

/**
 * Idempotent migration for databases created before "Try an example" became
 * admin-editable: adds the tools.example_hint (sentence) and
 * tools.example_values (JSON of the values the button fills) columns, then
 * backfills the 31 built-in tools with the defaults they previously hardcoded
 * in their widgets (the TOOL_EXAMPLES map was extracted verbatim from those
 * widgets). Admin-created tools (slugs not in the map) stay empty until the
 * admin fills the editor fields. Widgets fall back to their built-in example
 * when the columns are empty, so nothing breaks mid-upgrade.
 */
function migrateToolExamples(db: Database.Database) {
  const cols = (db.prepare("PRAGMA table_info(tools)").all() as { name: string }[]).map(
    (c) => c.name
  );
  if (!cols.includes("example_hint")) {
    db.prepare("ALTER TABLE tools ADD COLUMN example_hint TEXT NOT NULL DEFAULT ''").run();
  }
  if (!cols.includes("example_values")) {
    db.prepare("ALTER TABLE tools ADD COLUMN example_values TEXT NOT NULL DEFAULT ''").run();
  }
  const updateHint = db.prepare(
    "UPDATE tools SET example_hint = ? WHERE slug = ? AND example_hint = ''"
  );
  const updateValues = db.prepare(
    "UPDATE tools SET example_values = ? WHERE slug = ? AND example_values = ''"
  );
  const tx = db.transaction(() => {
    for (const [slug, cfg] of Object.entries(TOOL_EXAMPLES)) {
      if (cfg.hint) updateHint.run(cfg.hint, slug);
      if (cfg.values && Object.keys(cfg.values).length > 0) {
        updateValues.run(serializeToolExampleValues(cfg.values), slug);
      }
    }
  });
  tx();
}

/**
 * Idempotent migration for databases created before spike alerts covered
 * articles: adds the page_type column so a tool and an article sharing a slug
 * keep distinct alert rows. Existing tool alerts stay tagged 'tool'.
 */
function migrateAlertColumns(db: Database.Database) {
  const cols = db
    .prepare("PRAGMA table_info(alerts)")
    .all() as { name: string }[];
  if (cols.some((c) => c.name === "page_type")) return;
  // SQLite cannot ALTER a UNIQUE constraint, so rebuild the table with the
  // new column and unique key, carrying existing rows across. The whole swap
  // runs in ONE transaction: if the process dies mid-way, nothing is left
  // half-renamed (an orphaned alerts_old would otherwise strand the data).
  db.transaction(() => {
    db.exec(`
      ALTER TABLE alerts RENAME TO alerts_old;
      CREATE TABLE alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_type TEXT NOT NULL DEFAULT 'tool',
        slug TEXT NOT NULL,
        metric TEXT NOT NULL,
        value INTEGER NOT NULL DEFAULT 0,
        threshold INTEGER NOT NULL DEFAULT 0,
        alert_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'unread',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(page_type, slug, metric, alert_date)
      );
      INSERT INTO alerts (id, page_type, slug, metric, value, threshold, alert_date, status, created_at)
        SELECT id, 'tool', slug, metric, value, threshold, alert_date, status, created_at FROM alerts_old;
      DROP TABLE alerts_old;
    `);
  })();
}

/**
 * Idempotent migration for existing databases created before replies existed:
 * adds the parent_id (reply nesting), is_admin (admin reply marker) and email
 * (reply-notification address) columns without touching existing data.
 */
function migrateCommentColumns(db: Database.Database) {
  const cols = db
    .prepare("PRAGMA table_info(comments)")
    .all() as { name: string }[];
  const has = (name: string) => cols.some((c) => c.name === name);
  if (!has("parent_id")) {
    db.exec(
      "ALTER TABLE comments ADD COLUMN parent_id INTEGER NOT NULL DEFAULT 0"
    );
  }
  if (!has("is_admin")) {
    db.exec(
      "ALTER TABLE comments ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0"
    );
  }
  if (!has("email")) {
    db.exec(
      "ALTER TABLE comments ADD COLUMN email TEXT NOT NULL DEFAULT ''"
    );
  }
  if (!has("likes")) {
    db.exec(
      "ALTER TABLE comments ADD COLUMN likes INTEGER NOT NULL DEFAULT 0"
    );
  }
  // Index can only be created after the parent_id column exists.
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments (parent_id)"
  );
}

/**
 * Idempotent migration for databases created before Compact Mode (or the
 * dark high-contrast Easy Mode sub-option) existed: adds the missing
 * account_settings columns (0 = off, 1 = on) without touching existing rows.
 */
function migrateAccountSettingsColumns(db: Database.Database) {
  const cols = db
    .prepare("PRAGMA table_info(account_settings)")
    .all() as { name: string }[];
  if (!cols.some((c) => c.name === "compact_mode")) {
    db.exec(
      "ALTER TABLE account_settings ADD COLUMN compact_mode INTEGER NOT NULL DEFAULT 0"
    );
  }
  if (!cols.some((c) => c.name === "easy_contrast")) {
    db.exec(
      "ALTER TABLE account_settings ADD COLUMN easy_contrast INTEGER NOT NULL DEFAULT 0"
    );
  }
}

/**
 * Idempotent migration for the account /account page: adds device metadata
 * (user_agent, ip, last_seen) and a public session_id (a short non-secret id
 * used to revoke sessions from the UI — the session token itself is never
 * exposed to the client) to account_sessions.
 */
function migrateAccountSessionColumns(db: Database.Database) {
  const cols = db
    .prepare("PRAGMA table_info(account_sessions)")
    .all() as { name: string }[];
  const has = (name: string) => cols.some((c) => c.name === name);
  if (!has("user_agent")) {
    db.exec(
      "ALTER TABLE account_sessions ADD COLUMN user_agent TEXT NOT NULL DEFAULT ''"
    );
  }
  if (!has("ip")) {
    db.exec(
      "ALTER TABLE account_sessions ADD COLUMN ip TEXT NOT NULL DEFAULT ''"
    );
  }
  if (!has("last_seen")) {
    db.exec(
      "ALTER TABLE account_sessions ADD COLUMN last_seen TEXT NOT NULL DEFAULT ''"
    );
  }
  if (!has("session_id")) {
    // Existing rows: derive a stable id from rowid so they stay revocable.
    db.exec(
      "ALTER TABLE account_sessions ADD COLUMN session_id TEXT NOT NULL DEFAULT ''"
    );
    db.exec(
      `UPDATE account_sessions SET session_id = 's' || CAST(rowid AS TEXT) WHERE session_id = ''`
    );
  }
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_account_sessions_sid ON account_sessions (session_id)"
  );
}

/**
 * One-time seed: copies the static ingredient density list (the curated
 * USDA-style defaults shipped with the repo) into the editable DB table.
 * Only runs when the table is empty, so admin additions are never wiped.
 */
function seedIngredientDensities(db: Database.Database) {
  const row = db
    .prepare("SELECT COUNT(*) as count FROM ingredient_densities")
    .get() as { count: number };
  if (row.count > 0) return;
  const insert = db.prepare(
    "INSERT INTO ingredient_densities (name, g_per_cup, note) VALUES (?, ?, ?)"
  );
  const tx = db.transaction(() => {
    for (const d of DENSITIES) insert.run(d.name, d.gPerCup, d.note || "");
  });
  tx();
  console.log(`[migrate] seeded ${DENSITIES.length} ingredient density(ies)`);
}

/**
 * One-time seed: copies the curated food price list into the editable DB
 * table. Only runs when the table is empty, so admin additions are never
 * wiped.
 */
function seedFoodPrices(db: Database.Database) {
  const row = db
    .prepare("SELECT COUNT(*) as count FROM food_prices")
    .get() as { count: number };
  if (row.count > 0) return;
  const insert = db.prepare(
    "INSERT INTO food_prices (name, price_per_kg, note) VALUES (?, ?, ?)"
  );
  const tx = db.transaction(() => {
    for (const p of FOOD_PRICES) insert.run(p.name, p.pricePerKg, p.note || "");
  });
  tx();
  console.log(`[migrate] seeded ${FOOD_PRICES.length} food price(s)`);
}

function seedIfEmpty(db: Database.Database) {
  const row = db.prepare("SELECT COUNT(*) as count FROM tools").get() as {
    count: number;
  };
  if (row.count === 0) {
    seedDatabase(db);
    return;
  }
  migrateMissingSettings(db);
  migrateMissingTools(db);
  migrateLegacyFormulas(db);
}

/**
 * Idempotent migration: inserts any default settings added in newer seed data
 * that an existing database is missing. Existing admin-edited values are
 * never overwritten.
 */
function migrateMissingSettings(db: Database.Database) {
  const existing = new Set(
    (db.prepare("SELECT key FROM settings").all() as { key: string }[]).map(
      (r) => r.key
    )
  );
  const missing = Object.entries(siteSettingsSeed).filter(
    ([key]) => !existing.has(key)
  );
  if (missing.length === 0) return;
  const insert = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?)"
  );
  for (const [key, value] of missing) insert.run(key, value);
  console.log(`[migrate] added ${missing.length} missing default setting(s)`);
}

/**
 * One-time content cleanup: earlier seed data stored the "formula" field as
 * developer-style equations (e.g. "**°C = (°F − 32) × 5/9**"). All tools now
 * ship plain-language explanations for home cooks. This refreshes the formula
 * text of existing tools whose value still looks like math/code — while never
 * touching rows the admin has already rewritten in plain words.
 */
function migrateLegacyFormulas(db: Database.Database) {
  const bySlug = new Map(toolsSeed.map((t) => [t.slug, t.formula]));
  const rows = db
    .prepare("SELECT slug, formula FROM tools")
    .all() as { slug: string; formula: string }[];
  const update = db.prepare("UPDATE tools SET formula = ? WHERE slug = ?");
  const legacy = /[×÷]|°C\s*=|°F\s*=|\bFlour\s*=|\bWater\s*=|\bSalt\s*=|\bTotal\s*=|\bBase\s*=|\bfunction\b|\bconst\b/;
  let changed = 0;
  for (const row of rows) {
    const fresh = bySlug.get(row.slug);
    if (fresh && legacy.test(row.formula)) {
      update.run(fresh, row.slug);
      changed++;
    }
  }
  if (changed > 0) {
    console.log(`[migrate] refreshed formula text for ${changed} tool(s)`);
  }
}

/**
 * Idempotent migration: inserts any tools defined in toolsSeed that are not
 * yet in the database (keyed by unique slug). Existing tools — including any
 * admin edits — are left completely untouched.
 */
function migrateMissingTools(db: Database.Database) {
  const existing = new Set(
    (db.prepare("SELECT slug FROM tools").all() as { slug: string }[]).map(
      (r) => r.slug
    )
  );
  const missing = toolsSeed.filter((t) => !existing.has(t.slug));
  if (missing.length === 0) return;

  const insertTool = db.prepare(`
    INSERT INTO tools (
      slug, name, tagline, category, icon, description, how_to_use, formula,
      code, faq, tips, quick_guide, example_hint, example_values,
      meta_title, meta_description, featured, status, sort_order
    ) VALUES (
      @slug, @name, @tagline, @category, @icon, @description, @how_to_use, @formula,
      @code, @faq, @tips, @quick_guide, @example_hint, @example_values,
      @meta_title, @meta_description, @featured, 'active', @sort_order
    )
  `);
  const tx = db.transaction(() => {
    for (const tool of missing) {
      const ex = TOOL_EXAMPLES[tool.slug];
      insertTool.run({
        slug: tool.slug,
        name: tool.name,
        tagline: tool.tagline,
        category: tool.category,
        icon: tool.icon,
        description: tool.description,
        how_to_use: tool.how_to_use,
        formula: tool.formula,
        code: tool.code,
        faq: JSON.stringify(tool.faq),
        tips: JSON.stringify(tool.tips),
        quick_guide: serializeQuickGuide(QUICK_GUIDES[tool.slug] ?? []),
        example_hint: ex?.hint ?? "",
        example_values: ex?.values && Object.keys(ex.values).length > 0 ? serializeToolExampleValues(ex.values) : "",
        meta_title: tool.meta_title,
        meta_description: tool.meta_description,
        featured: tool.featured,
        sort_order: tool.sort_order
      });
    }
  });
  tx();
}
