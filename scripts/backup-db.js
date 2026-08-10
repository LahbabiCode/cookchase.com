/*
 * CookChase — consistent SQLite backup
 *
 *   node scripts/backup-db.js [label] [outDir]
 *
 * Uses better-sqlite3's online backup API (VACUUM INTO equivalent) so the
 * copy is always consistent even while the app is running (WAL mode is
 * handled automatically). Labels default to "backup"; outDir defaults to
 * ./backups. Honors DATA_DIR / DATABASE_PATH like the rest of the app.
 */
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const label = process.argv[2] || "backup";
const outDir = process.argv[3] || path.join(process.cwd(), "backups");
const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, "cookchase.db");

if (!fs.existsSync(dbPath)) {
  console.log(`[backup] No database at ${dbPath} — nothing to back up.`);
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .slice(0, 19);
const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, "-");
const outPath = path.join(outDir, `${safeLabel}-${stamp}.db`);

// readonly + online backup: safe to run while the server is live.
const source = new Database(dbPath, { readonly: true });
source
  .backup(outPath)
  .then(() => {
    source.close();
    const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
    console.log(`[backup] Wrote ${outPath} (${sizeKb} KB)`);
  })
  .catch((err) => {
    source.close();
    console.error(`[backup] FAILED: ${err.message}`);
    process.exit(1);
  });
