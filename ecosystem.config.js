/**
 * PM2 configuration — run CookChase in production on a VPS.
 *
 *   npm run build
 *   pm2 start ecosystem.config.js
 *   pm2 save && pm2 startup   # restart on reboot
 *
 * Point a reverse proxy (Caddy/Nginx) at http://127.0.0.1:3000.
 */
module.exports = {
  apps: [
    {
      name: "cookchase",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        // Canonical URL — must match the public domain.
        SITE_URL: process.env.SITE_URL || "https://cookchase.com",
        DATA_DIR: process.env.DATA_DIR || require("path").join(__dirname, "data"),
        ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET || ""
      },
      out_file: "logs/out.log",
      error_file: "logs/error.log",
      merge_logs: true,
      time: true
    }
  ]
};
