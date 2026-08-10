/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output produces a self-contained server (server.js) that is
  // ideal for Docker / VPS deployments. `next start` keeps working locally too.
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"]
  },
  // Brotli/gzip text compression — the single biggest wire-size win for an
  // HTML/CSS/JS-heavy site. `next start` compresses by default, but this also
  // covers standalone/serverless paths that defer to this config.
  compress: true,
  // Remove the X-Powered-By fingerprint header (minor info leak).
  poweredByHeader: false,
  // Cache-Control strategy (the production host — Vercel/Railway/CDN — applies
  // these; standalone servers and reverse proxies pick them up too):
  //   - hashed static assets: immutable, 1 year
  //   - text files (sitemap/robots/ads.txt/verification files): short public cache
  //   - API responses: never cached (dynamic data)
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
        ]
      },
      {
        source: "/:path*.txt",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }
        ]
      },
      {
        source: "/:path*.xml",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }
        ]
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" }
        ]
      }
    ];
  }
};

export default nextConfig;
