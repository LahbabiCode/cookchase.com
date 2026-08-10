/* Reset the CookChase database. WARNING: this deletes all admin edits. */
const fs = require("fs");
const path = require("path");

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, "cookchase.db");

if (process.env.DATABASE_PATH) {
  // Explicit single-file path: remove just that file (plus its WAL/SHM).
  for (const suffix of ["", "-wal", "-shm"]) {
    const f = dbPath + suffix;
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
      console.log("Deleted", f);
    }
  }
} else {
  const files = fs.existsSync(dataDir) ? fs.readdirSync(dataDir) : [];
  for (const f of files) {
    if (f.startsWith("cookchase.db")) {
      fs.unlinkSync(path.join(dataDir, f));
      console.log("Deleted", f);
    }
  }
}
console.log("Done. The database will be recreated & reseeded on next server start.");
