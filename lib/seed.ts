import type Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import {
  siteSettingsSeed,
  toolsSeed,
  sectionsSeed,
  pagesSeed,
  adsSeed,
  articlesSeed
} from "./seed-data";
import {
  TOOL_EXAMPLES,
  serializeToolExampleValues
} from "./tool-examples";
import { QUICK_GUIDES, serializeQuickGuide } from "./quick-guides";

export function seedDatabase(db: Database.Database) {
  const tx = db.transaction(() => {
    // Settings
    const upsertSetting = db.prepare(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
    );
    for (const [key, value] of Object.entries(siteSettingsSeed)) {
      upsertSetting.run(key, value);
    }

    // Tools
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
    for (const tool of toolsSeed) {
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
        example_values:
          ex?.values && Object.keys(ex.values).length > 0
            ? serializeToolExampleValues(ex.values)
            : "",
        meta_title: tool.meta_title,
        meta_description: tool.meta_description,
        featured: tool.featured,
        sort_order: tool.sort_order
      });
    }

    // Sections
    const insertSection = db.prepare(`
      INSERT OR REPLACE INTO sections (key, title, subtitle, content, badge, enabled)
      VALUES (@key, @title, @subtitle, @content, @badge, @enabled)
    `);
    for (const s of sectionsSeed) {
      insertSection.run(s);
    }

    // Pages
    const insertPage = db.prepare(`
      INSERT OR REPLACE INTO pages (slug, title, subtitle, content, meta_title, meta_description, updated_at)
      VALUES (@slug, @title, @subtitle, @content, @meta_title, @meta_description, datetime('now'))
    `);
    for (const p of pagesSeed) {
      insertPage.run(p);
    }

    // Ads
    const insertAd = db.prepare(`
      INSERT INTO ads (name, location, code, enabled, sort_order)
      VALUES (@name, @location, @code, @enabled, @sort_order)
    `);
    for (const a of adsSeed) {
      insertAd.run(a);
    }

    // Articles
    const insertArticle = db.prepare(`
      INSERT INTO articles (slug, title, excerpt, content, category, meta_title, meta_description, published, created_at, updated_at)
      VALUES (@slug, @title, @excerpt, @content, @category, @meta_title, @meta_description, 1, datetime('now'), datetime('now'))
    `);
    for (const a of articlesSeed) {
      insertArticle.run(a);
    }

    // Admin user: admin / admin1234 (change it from the admin panel!)
    const insertUser = db.prepare(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)"
    );
    const hash = bcrypt.hashSync("admin1234", 10);
    insertUser.run("admin", hash);
  });

  tx();
}
