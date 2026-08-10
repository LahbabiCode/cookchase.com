# 🚀 CookChase — Complete Deployment Guide

Take CookChase from your local machine to a live site on **cookchase.com** with
HTTPS, a working sitemap, and everything Google AdSense reviewers look for.

> **The one rule that matters:** CookChase stores *everything* — your admin
> edits, comments and analytics — in a **SQLite file** (`data/cookchase.db`).
> Pick a hosting option where that file lives on a **persistent disk**. All
> three options below handle this correctly, but with very different effort.

---

## Table of contents

1. [Quick decision guide](#1-quick-decision-guide)
2. [Option A — Vercel (serverless, free)](#2-option-a--vercel-serverless-free)
3. [Option B — Railway (persistent disk, easy)](#3-option-b--railway-persistent-disk-easy)
4. [Option C — VPS / Docker (full control)](#4-option-c--vps--docker-full-control)
5. [Connect the domain cookchase.com](#5-connect-the-domain-cookchasecom)
6. [HTTPS setup](#6-https-setup)
7. [Sitemap & SEO verification](#7-sitemap--seo-verification)
8. [Google AdSense — final checklist](#8-google-adsense--final-checklist)
9. [Admin access & first steps](#9-admin-access--first-steps)
10. [Backups & database](#10-backups--database)
11. [Updates & maintenance](#11-updates--maintenance)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Quick decision guide

| You want… | Choose | Persistent SQLite? |
| --------- | ------ | ------------------ |
| Simplest UI, free tier, auto-HTTPS | **Option A — Vercel** | ⚠️ No (ephemeral `/tmp`) |
| Easy deploy **and** a persistent disk | **Option B — Railway** | ✅ Yes (volume) |
| Full control, cheapest long-run | **Option C — VPS/Docker** | ✅ Yes (volume) |

**Bottom line for an AdSense site you'll grow:** Option B (Railway) is the
sweet spot — one-click deploys like Vercel, but with a real persistent volume
for the database, so admin edits and comments survive redeploys.

---

## 2. Option A — Vercel (serverless, free)

### 2.1 Push the code to a Git provider

Vercel deploys straight from a Git repo (GitHub / GitLab / Bitbucket).

```bash
cd cookchase.com
git init
git add .
git commit -m "Initial commit"
# create an empty repo on GitHub, then:
git remote add origin https://github.com/YOUR_USER/cookchase.git
git push -u origin main
```

> Make sure `data/`, `.env*` and `.next/` are **not** committed — the included
> `.gitignore` already handles this.

### 2.2 Import into Vercel

1. Go to <https://vercel.com/new> and **Import** your repo.
2. Vercel auto-detects **Next.js** and reads `vercel.json` (framework, security
   headers, static caching — all pre-configured).
3. **Environment Variables** (Project → Settings → Environment Variables):
   - `SITE_URL` = `https://cookchase.com`
   - `DATA_DIR` = `/tmp/data` *(Vercel's writable, ephemeral tmp dir)*
   - `ADMIN_SESSION_SECRET` = a long random string
     (e.g. `openssl rand -hex 32`)
4. Click **Deploy**.

> **Important Vercel note:** serverless functions have an **ephemeral**
> filesystem — the SQLite file in `/tmp` is wiped on each new instance, so
> admin edits and comments reset on redeploys. **Use Vercel for previews or a
> demo.** For a site where you manage content, choose Railway or a VPS.

### 2.3 Set the production domain

Project → **Settings → Domains** → **Add** `cookchase.com` and
`www.cookchase.com`. Vercel shows the exact DNS records to create (§5).

---

## 3. Option B — Railway (persistent disk, easy)

Railway deploys from Git, keeps your SQLite on a **persistent volume**, and
issues HTTPS certificates automatically. Best balance of easy + durable.

### 3.1 What's already prepared

- The repo already ships a **production `Dockerfile`** (multi-stage,
  standalone Next.js server) — Railway uses it automatically when present.
- `next.config.mjs` sets `output: "standalone"`, so the container runs
  `node server.js` directly (no dev server, small image).

### 3.2 Deploy steps

1. Push the code to GitHub (see §2.1).
2. Go to <https://railway.app> → **New Project** → **Deploy from GitHub repo**.
3. Railway detects the `Dockerfile` and builds it. No Nixpacks config needed.
4. **Variables** (Project → your service → Variables):
   - `SITE_URL` = `https://cookchase.com`
   - `DATA_DIR` = `/app/data`  ← **must match the volume mount path**
   - `ADMIN_SESSION_SECRET` = a long random string
   - (`PORT` is injected automatically by Railway; the standalone server honors it)

### 3.3 Add the persistent volume (critical!)

1. Service → **Settings → Volumes** → **Add Volume**.
2. **Mount path:** `/app/data`
3. Railway provisions a persistent disk there. The SQLite file lives at
   `/app/data/cookchase.db` and **survives every redeploy and restart**.

> ⚠️ **Gotcha:** Railway's *Pre-deploy Commands* run in a separate container
> where volumes are **not** mounted. CookChase initializes its schema at app
> startup (inside the running container), so you don't need pre-deploy commands
> — just don't add any that touch the database.

### 3.4 Custom domain

1. Service → **Settings → Networking → Custom Domain**.
2. Add `cookchase.com` and `www.cookchase.com`.
3. Railway gives you **two records per domain** — add **both** at your registrar:
   - A **CNAME** record → your service's `*.up.railway.app` address.
   - A **TXT** record → the ownership-verification value Railway shows.
4. HTTPS is automatic (Let's Encrypt) once DNS resolves.

> ⚠️ If you skip the TXT record, the domain returns **404** even though the
> CNAME is correct. Add both.

### 3.5 If your DNS is on Cloudflare

Keep the domain **Proxied (orange cloud)** but set **SSL/TLS → Full** (not
"Full (strict)") to avoid handshake errors during Railway's certificate
renewals.

---

## 4. Option C — VPS / Docker (full control)

### 4.1 With Docker Compose (recommended)

```bash
# 1. Copy the project to the server
rsync -av --exclude node_modules --exclude .next --exclude data ./ user@YOUR_SERVER:/opt/cookchase/

# 2. SSH in and deploy
ssh user@YOUR_SERVER
cd /opt/cookchase
docker compose up -d --build
```

The site is live on port **3000** with a persistent named volume
(`cookchase-data`) holding the SQLite database.

```bash
docker compose ps
curl http://localhost:3000
```

### 4.2 With PM2 on a plain VPS (no Docker)

```bash
# Node 20 LTS
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20

cd /opt/cookchase
npm ci
npm run build

npm i -g pm2
pm2 start ecosystem.config.js   # reads SITE_URL/DATA_DIR from the file
pm2 save
pm2 startup                      # follow the printed instructions
```

### 4.3 Reverse proxy

See [§6 HTTPS](#6-https-setup). The app listens on `127.0.0.1:3000` (or the
Docker container on 3000) and the proxy terminates TLS.

---

## 5. Connect the domain cookchase.com

DNS changes propagate in ~1–24h (usually minutes with Cloudflare).

### 5.1 Vercel

| Record | Host/Name | Value                             | TTL  |
| ------ | --------- | --------------------------------- | ---- |
| A      | `@`       | `76.76.21.21`                     | 3600 |
| CNAME  | `www`     | `cookchase.vercel.app` (or yours) | 3600 |

### 5.2 Railway

| Record | Host/Name | Value                          | TTL  |
| ------ | --------- | ------------------------------ | ---- |
| CNAME  | `@`       | `<service>.up.railway.app`     | 3600 |
| TXT    | `@`       | *verification value from Railway* | 3600 |
| CNAME  | `www`     | `<service>.up.railway.app`     | 3600 |
| TXT    | `www`     | *verification value from Railway* | 3600 |

(Some registrars can't put a CNAME on the apex `@` — then point the apex `A`
record at Railway's IP and keep the `www` CNAME; Railway shows the exact values
in the dashboard.)

### 5.3 VPS

| Record | Host/Name | Value            | TTL  |
| ------ | --------- | ---------------- | ---- |
| A      | `@`       | `YOUR_SERVER_IP` | 3600 |
| CNAME  | `www`     | `@`              | 3600 |

Configure the server to redirect `www → apex` (or vice versa) in §6.

### 5.4 Cloudflare (recommended anywhere)

1. Add the site to Cloudflare (free) → it imports existing records.
2. Leave **Proxied (orange cloud)**.
3. **SSL/TLS mode:** Full for Railway/VPS; Full (strict) also works on VPS with
   Caddy/Nginx and on Vercel.
4. Add a redirect rule: `http://cookchase.com/*` and `https://www.cookchase.com/*`
   → `https://cookchase.com/$1`.

---

## 6. HTTPS setup

The app serves plain HTTP internally; TLS is handled by the platform or a
reverse proxy. HTTPS is required by both Google and AdSense reviewers.

### 6.1 Vercel / Railway

**Automatic.** Both platforms issue and renew Let's Encrypt certificates for
your domains as soon as DNS resolves. No action needed.

### 6.2 Cloudflare (any backend)

Proxy the domain and enable **SSL/TLS → Full** (or Full (strict) for VPS with
real certs on the origin).

### 6.3 Caddy (simplest VPS option — auto HTTPS)

`/etc/caddy/Caddyfile`:

```caddyfile
cookchase.com, www.cookchase.com {
    reverse_proxy 127.0.0.1:3000

    @static path /_next/static/* /icon.svg
    header @static Cache-Control "public, max-age=31536000, immutable"

    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
```

```bash
sudo systemctl restart caddy
```

Caddy obtains/renews certificates automatically and redirects `www → apex`.

### 6.4 Nginx + Certbot (VPS)

```nginx
server {
    listen 80;
    server_name cookchase.com www.cookchase.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cookchase.com www.cookchase.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d cookchase.com -d www.cookchase.com
```

---

## 7. Sitemap & SEO verification

CookChase generates both files **dynamically** from the database:

| File | URL |
| ---- | --- |
| Sitemap | `https://cookchase.com/sitemap.xml` |
| Robots | `https://cookchase.com/robots.txt` |

### 7.1 What you should see

- **`/sitemap.xml`** — homepage, all static pages, every tool page
  (`/tools/<slug>`, 25 tools) and every blog article. URLs come from `SITE_URL`.
- **`/robots.txt`** — allows all crawlers, disallows `/admin` and `/api`, and
  references `Sitemap: https://cookchase.com/sitemap.xml`.

### 7.2 Set `SITE_URL` first

Set the production env var `SITE_URL=https://cookchase.com` (Vercel/Railway
env vars, docker-compose, or `.env`). It overrides the admin setting and keeps
canonical links, sitemap and JSON-LD consistent. After deploying, open
`/sitemap.xml` and confirm **zero** `localhost` URLs.

### 7.3 Submit to Google Search Console

1. <https://search.google.com/search-console> → **Add property** → **Domain** →
   `cookchase.com`.
2. Verify via the **DNS TXT record** (recommended — no code change). Add the TXT
   record at your registrar/Cloudflare.
3. **Sitemaps** → submit `https://cookchase.com/sitemap.xml`.
4. **URL Inspection** → paste `https://cookchase.com` → **Request indexing**.
5. Repeat the URL inspection for your 2–3 most important tool pages
   (e.g. `/tools/recipe-scaler`).

### 7.4 Submit to Bing (optional, free)

<https://www.bing.com/webmasters> — import from Google Search Console (one
click) or verify with the same TXT record, then submit the sitemap.

---

## 8. Google AdSense — final checklist

Run through this **right before** you submit the site to AdSense. The site was
built with these in mind, but only a live, reachable site passes review.

### 8.1 Site content & pages ✅ (already built)

- [ ] **Original, valuable content** — 25 interactive tools, each with an
      "About this tool", "How to use it", "How this tool works", FAQ and pro
      tips. No scraped or thin pages.
- [ ] **Essential pages exist and are linked in the footer:**
      About (`/about`), Contact (`/contact`), Privacy Policy (`/privacy`),
      Terms of Service (`/terms`). The Privacy Policy explicitly discloses
      third-party advertising (AdSense) and cookies.
- [ ] **Privacy page mentions advertising partners** — it already names Google
      AdSense and links to Google's Ads Settings / aboutads.info.
- [ ] **No forbidden content** — no adult, gambling, drugs, counterfeit,
      copyrighted-streaming, or dangerous content anywhere.
- [ ] **English, well-written copy** — no placeholder/lorem text, no broken
      English, no "under construction" pages.

### 8.2 Technical & UX ✅ (already built)

- [ ] **HTTPS is active** on both `cookchase.com` and `www.cookchase.com`.
- [ ] **Site loads fast** — static-first Next.js, cached `/`_next/static` assets
      (immutable cache headers in `vercel.json`/Caddy).
- [ ] **Mobile-friendly** — fully responsive, tap-sized buttons, readable type.
- [ ] **No dead links** — click through tools, blog, footer and the admin link.
- [ ] **robots.txt allows crawling** (`Allow: /`) and references the sitemap.
- [ ] **Sitemap submitted** to Google Search Console (see §7).
- [ ] **Analytics active** — put your `G-XXXXXXX` in **/admin → Settings →
      Analytics** so you can show activity in the AdSense "policy check" form.

### 8.3 Verify ownership & set up ads.txt ✅ (already wired)

CookChase ships **both** Google verification methods ready to go — no server
file editing needed.

**Option 1 — HTML file (automatic, zero config):**

- The site serves **any** `google<code>.html` file dynamically. Open
  `https://cookchase.com/google<your-code>.html` and it returns the exact
  verification line Google expects, no matter what code you're given.
- In Search Console / AdSense, pick **"HTML file"** as the method, and use the
  URL `https://cookchase.com/google<your-code>.html` — it just works.

**Option 2 — Meta tag (recommended, admin-controlled):**

- Go to **/admin → Ads → Google site verification** and paste the meta-tag
  content value Google shows you (e.g. `google1a2b3c4d5e6f7g8h9i0j`).
- It renders as a `google-site-verification` meta tag on every page
  immediately — no redeploy needed.

**ads.txt:**

- A ready `public/ads.txt` ships with the repo and is served at
  `https://cookchase.com/ads.txt`. After AdSense approval, replace
  `pub-XXXXXXXXXXXXXXXX` with your real publisher ID in
  `public/ads.txt` and redeploy. (The trailing `f08c47fec0942fa0` is Google's
  official verification tag — keep it exactly as-is.)

### 8.4 Before submitting the application

- [ ] The domain is **fully connected and resolves** (`dig cookchase.com`).
- [ ] You own the domain and can add DNS records (verification may require it).
- [ ] **Do NOT paste AdSense code yet.** Leave `adsense_enabled = 0` (default)
      until AdSense approves you — running ad code on an unapproved site is a
      policy violation.
- [ ] Set a **strong admin password** (Settings → Security) — reviewers look at
      professionalism, and a default `admin1234` is a red flag.
- [ ] Fill in **contact email** and **social links** in Settings.

### 8.5 After approval

1. Copy your **publisher ID** (`ca-pub-XXXXXXXXXXXX`).
2. **/admin → Ads** → paste the ID in **"AdSense publisher ID"** and tick
   **"Enable AdSense ads"** → Save.
3. The site already places responsive AdSense units in 5 pre-wired locations:
   **header**, **footer**, **home middle**, **tool top** and **tool bottom**.
   You can also drop custom `<ins>` ad code per slot in the same page.
4. Optionally add **Auto ads** from your AdSense dashboard for extra fill.
5. Verify ads render: open any tool page, wait a few seconds, and check for a
   blank/placeholder box only if there are no matched ads (normal for brand-new
   sites — fill improves over days).
6. Keep publishing **blog articles** regularly (via /admin → Articles) — fresh
   content is what keeps a new site healthy and indexed.

---

## 9. Admin access & first steps

1. Open `https://cookchase.com/admin` and log in:
   - **Username:** `admin`
   - **Password:** `admin1234`
2. **Immediately** change the password (Settings → Security).
3. Confirm **Site URL** = `https://cookchase.com` in Settings.
4. Fill social links, analytics ID, and (after AdSense approval) the publisher ID.

---

## 10. Backups & database

Everything lives in `data/cookchase.db`. Back it up regularly.

### Docker / Railway volume
```bash
# Docker: stream the file out (safe during runtime thanks to WAL mode)
docker compose exec -T cookchase sh -c "cat /app/data/cookchase.db" > backup-$(date +%F).db

# Railway: add an ephemeral job (or use Railway's built-in volume backups),
# or download the volume via the dashboard.
```

### VPS / local
```bash
cp data/cookchase.db backups/cookchase-$(date +%F).db
```

### Restore
```bash
# Docker
docker compose down
docker run --rm -v cookchase-data:/data -v $(pwd):/backup alpine cp /backup/backup.db /data/cookchase.db
docker compose up -d
```

> **Pro tip:** before a major change, `npm run reset-db` recreates a pristine
> database (deletes all admin edits — backup first!).

---

## 11. Updates & maintenance

```bash
# Vercel / Railway: just push to main — auto-deploys.
git push origin main

# Docker
git pull && docker compose up -d --build

# PM2
git pull && npm ci && npm run build && pm2 restart cookchase
```

New tools are added in `lib/seed-data.ts` + a widget in `components/tools/` —
the idempotent migration in `lib/db.ts` inserts new tools into an existing
database automatically on next start. No manual SQL.

### 11.1 One-command deploy to your own server (`deploy.sh`) ✅

The repo ships a single automated deploy script for a VPS (Option C). It now
supports **multiple environments** — a staging server and a production server —
each with its own config file, plus a `--pipeline` mode that deploys to
staging first, runs the automatic checks, and only then asks about production.

**1. One-time config — copy the templates and fill in the servers:**

```bash
cp .env.deploy.staging.example .env.deploy.staging   # staging server details
cp .env.deploy.prod.example    .env.deploy.prod      # production server details
# (or cp .env.deploy.example .env.deploy for a single-environment setup)
```

Each file supports the same keys:

| Key | Default | Meaning |
| --- | ------- | ------- |
| `DEPLOY_HOST` | *(required)* | SSH host / IP of the server |
| `DEPLOY_USER` | `root` | SSH user |
| `DEPLOY_PATH` | `/opt/cookchase` | Deploy directory on the server |
| `DEPLOY_PORT` | `22` | SSH port |
| `DEPLOY_KEY` | *(empty)* | Path to an SSH private key |
| `DEPLOY_MODE` | `docker` | `docker` or `pm2` restart strategy |
| `DEPLOY_SITE_URL` | `http://localhost:3000` | Public URL for the health check |
| `BACKUP_KEEP` | `14` | How many backups to keep |
| `DEPLOY_CHECK_PATHS` | *(empty)* | Extra space-separated URL paths to verify after deploy |
| `DEPLOY_NOTIFY` | `0` | Set `1` to send deploy notifications to a webhook |
| `DEPLOY_WEBHOOK_TYPE` | *(empty)* | `telegram`, `slack` or `discord` |
| `DEPLOY_WEBHOOK_URL` | *(empty)* | Incoming-webhook URL (Slack/Discord) |
| `DEPLOY_TELEGRAM_TOKEN` | *(empty)* | Telegram bot token |
| `DEPLOY_TELEGRAM_CHAT_ID` | *(empty)* | Telegram chat ID |

> Inline environment variables always override the config file, which lets
> you deploy one-off: `DEPLOY_HOST=203.0.113.10 ./deploy.sh` still works.

**2. Deploy a single environment:**

```bash
./deploy.sh --env staging   # deploy to staging only
./deploy.sh --env prod      # deploy to production only
./deploy.sh                 # single-env: uses .env.deploy (or inline vars)
```

**3. Full pipeline — staging first, then production:**

```bash
./deploy.sh --pipeline            # deploy staging, verify, prompt before prod
./deploy.sh --pipeline --yes      # same, but no prompt (CI-friendly)
./deploy.sh --pipeline --dry-run  # see every step without touching servers
```

The pipeline deploys to staging, runs the full verification against
`staging.cookchase.com`, and only proceeds to production after staging passes.
It reuses the staging build for production (faster) and keeps a separate
backup history for each server.

**4. Verify a live environment without deploying (`--check-only`):**

```bash
./deploy.sh --check-only --env staging   # verify staging is healthy now
./deploy.sh --check-only --env prod      # verify production is healthy now
./deploy.sh --pipeline --check-only      # verify both environments
```

**Handy flags:**

```bash
./deploy.sh --dry-run       # print every step without doing anything
./deploy.sh --skip-build    # reuse the existing local .next build
./deploy.sh --mode pm2      # force PM2 restart (default: docker)
./deploy.sh --help          # usage summary
```

What it does, in order (per environment):

1. **Preflight** — checks `ssh` (and `rsync`, falling back to `tar | ssh`
   automatically on Windows Git Bash where rsync is usually missing) and
   verifies the server is reachable.
2. **Build** — `npm ci && npm run build` locally (skippable with
   `--skip-build`).
3. **Local DB backup** — a *consistent* SQLite backup (via better-sqlite3's
   online backup API, WAL-safe) into `./backups/local-*.db`.
4. **Remote DB backup** — before touching anything, it backs up the **live
   server database**. In docker mode this runs *inside* the running container
   and writes to `/app/data/backups` (inside the persistent volume); in PM2
   mode it writes to `backups/remote-*.db` next to the code. If that step
   fails, the deploy aborts. Your data is never at risk.
5. **Sync** — uploads the code. The `data/` directory is **never** uploaded:
   the server keeps its own live database.
6. **Restart** — `docker compose up -d --build` (docker) or
   `npm ci && npm run build && pm2 restart cookchase` (PM2).
7. **Verification** — retries the homepage, then checks `robots.txt`
   references the sitemap, `sitemap.xml` serves the configured host (no
   `localhost` leakage), and every `DEPLOY_CHECK_PATHS` entry returns 2xx/3xx.
   On failure it prints log-tailing commands and the restore instructions.

**5. Deploy notifications (Telegram / Slack / Discord):**

After every deploy the script can post a **success** or **failure** message
with the HTTP status, deploy duration, and how many local + remote backups are
kept. Configure it per environment in the same config file:

```bash
DEPLOY_NOTIFY=1

# Option A — Slack or Discord: create an incoming webhook in the channel
# (Slack: Apps → Incoming Webhooks; Discord: Server Settings → Integrations →
# Webhooks) and paste its URL.
DEPLOY_WEBHOOK_TYPE=slack      # or: discord
DEPLOY_WEBHOOK_URL=https://hooks.slack.com/services/<REPLACE_WITH_YOUR_WEBHOOK>

# Option B — Telegram: create a bot with @BotFather, get the token, then send
# /start to the bot from your chat and read the chat id (e.g. from @userinfobot).
# DEPLOY_WEBHOOK_TYPE=telegram
# DEPLOY_TELEGRAM_TOKEN=123456789:AAExampleBotToken
# DEPLOY_TELEGRAM_CHAT_ID=123456789
```

- The **failure** notification also fires on *any* error mid-deploy (build
  failure, unreachable server, failed backup, failed verification) — the
  EXIT trap catches every non-zero exit after the deploy starts.
- A failed notification never fails a successful deploy, and a successful
  deploy never gets double-reported.
- Preflight fails fast with a clear message if `DEPLOY_NOTIFY=1` but the
  webhook isn't fully configured (or `curl` is missing).

**Handy flags:**

```bash
./deploy.sh --dry-run       # print every step without doing anything
./deploy.sh --skip-build    # reuse the existing local .next build
./deploy.sh --mode pm2      # force PM2 restart (default: docker)
./deploy.sh --help          # usage summary
```

> Backups are pruned automatically, keeping the newest `BACKUP_KEEP` (14)
> local + remote copies per environment. To roll back a database:
>
> - **PM2:** copy the newest `backups/remote-*.db` on the server back to
>   `data/cookchase.db`.
> - **Docker:** `docker compose exec cookchase sh -c 'cp
>   /app/data/backups/remote-<newest>.db /app/data/cookchase.db'`.

### 11.2 Suggested deployment day

1. `npm run build` locally, then click through the site and /admin.
2. Run `./deploy.sh --pipeline` and watch staging deploy, verify, and prompt
   you before production.
3. Confirm the live site + sitemap, then submit to Google Search Console.

### 11.3 Automatic monthly report email ✅

CookChase can **email you a monthly performance report** (previous month's
views, comments and top tools) as a PDF, CSV or both, on the **1st of each
month** — no manual exporting.

**1. Turn it on in the admin panel** (`/admin → Settings → Monthly report email`):

- Tick **Enable monthly report**.
- Pick the **format**: `pdf`, `csv` or `both`.
- Set a **recipient** (leave empty to use the SMTP notify email).
- Requires the **Email notifications (SMTP)** section to be configured and
  enabled — the report is sent with the exact same SMTP settings.

**2. Schedule the cron — pick the option that matches your hosting:**

| Hosting | How it runs | Setup |
| ------- | ----------- | ----- |
| **Vercel** | Built-in cron, `0 8 1 * *` (1st of month, 08:00 UTC) — already in `vercel.json` | Set the env var **`CRON_SECRET`** (any long random string). Vercel sends it as `Authorization: Bearer` automatically; the endpoint accepts that header or an admin session. |
| **Railway / VPS / external** | Any scheduler hits `POST /api/cron/monthly-report` | `CRON_SECRET=<secret> npm run send-report -- <site-url>` runs the bundled script, or point cron-job.org / GitHub Actions at the URL with the `Authorization: Bearer <CRON_SECRET>` header. |
| **VPS crontab** | Runs on the server | Add to `crontab -e`:
  `0 8 1 * * cd /opt/cookchase && CRON_SECRET=<secret> node scripts/send-monthly-report.js https://cookchase.com >> logs/cron.log 2>&1` |

**3. Test it before the 1st:** open `/admin → Settings → Monthly report email`
and hit **Send now**. It builds the previous month's report and emails it
immediately (the button skips the once-per-month guard).

> **How it stays once-per-month:** the send date (`YYYY-MM`) is recorded in
> `monthly_report_last_sent`; the cron skips cleanly if the month is already
> sent, so retries from Vercel or a misbehaving scheduler never spam you.
> The report covers the **previous calendar month** (run it on the 1st to get
> the full prior month).

---

## 12. Troubleshooting

| Problem | Likely cause & fix |
| ------- | ------------------ |
| `502 Bad Gateway` on VPS | App isn't listening on 3000 — check `docker compose ps` / `pm2 status`; proxy must target `127.0.0.1:3000`. |
| Custom domain 404 on Railway | You added the CNAME but **not the TXT verification record** — add both. |
| Sitemap shows `localhost` | `SITE_URL` not set — set it in the env and redeploy/restart. |
| Admin edits lost after deploy | SQLite on an ephemeral disk (Vercel `/tmp` or no volume on Railway). Mount a volume at `/app/data` (Railway) or move to VPS. |
| `www` doesn't load | Missing `CNAME www → @` (VPS), or the `www` domain wasn't added on Vercel/Railway. |
| Certificate errors | DNS still propagating — wait up to 24h. On Cloudflare + Railway use SSL mode **Full**, not Full (strict). |
| Cloudflare 526 / redirect loop | SSL mode set to Full (strict) with an origin that uses Cloudflare's origin cert — switch to **Full**. |
| Comments don't appear | They're moderated by design — approve them in `/admin/comments`. |
| Ads never render after approval | Fill is low on new sites; also confirm `adsense_enabled=1` and the publisher ID is set in /admin → Ads. |
| Google verification won't pass | Use the **HTML file** method with `https://cookchase.com/google<code>.html` (served automatically), or paste the meta tag in **/admin → Ads → Google site verification**. |
| `ads.txt` missing | The repo ships `public/ads.txt` — redeploy after editing it so the live site picks it up. Verify at `https://cookchase.com/ads.txt`. |
| Can't log in to admin | You forgot the password — reset by deleting `data/cookchase.db` (or `npm run reset-db`), which recreates `admin/admin1234`. |

---

© CookChase. Deploy it, submit it, then go cook something.

> **All free, always:** CookChase has no paid plans, no subscriptions and no
> paywalls. Every tool, feature and export is free for everyone. The site is
> funded by clean, non-intrusive advertising (AdSense) on the free tier.
