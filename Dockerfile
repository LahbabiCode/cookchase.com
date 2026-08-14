# syntax=docker/dockerfile:1

#############################################################################
# CookChase — production image
# Build:  docker build -t cookchase .
# Run:    docker run -p 3000:3000 -v cookchase-data:/app/data cookchase
#############################################################################

# ---------- Stage 1: dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app
# better-sqlite3 needs its native binding; prebuilt binaries exist for alpine.
RUN apk add --no-cache python3 make g++ libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# ---------- Stage 2: build ----------
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- Stage 3: runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone output (server.js + traced node_modules) + static assets.
# `public/` is not part of the standalone bundle — copy it explicitly or
# ads.txt and the self-hosted fonts 404 in production.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Data directory must be writable at runtime (SQLite file lives here).
# Mount a persistent volume at /app/data in production.
RUN mkdir -p /app/data && chmod 777 /app/data

EXPOSE 3000
CMD ["node", "server.js"]
