# syntax=docker/dockerfile:1.7
# Multi-stage Dockerfile untuk Next.js + Prisma + PostgreSQL
# Image akhir ringan (~150-200MB) dan jalan sebagai non-root user

# ====== Stage 1: Dependencies ======
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy hanya manifest dulu untuk caching layer
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile
RUN pnpm prisma generate

# ====== Stage 2: Builder ======
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build aplikasi (Next.js standalone output)
RUN pnpm build

# ====== Stage 3: Runner ======
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Buat non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install Prisma CLI global (dipakai docker-entrypoint untuk `prisma migrate deploy`).
# Versinya disamakan dengan @prisma/client di package.json supaya engine kompatibel.
RUN npm install -g prisma@5.22.0

# Copy hanya yang dibutuhkan dari builder.
# Next.js standalone sudah include node_modules yang dipakai (termasuk Prisma client
# lewat outputFileTracingIncludes di next.config.js).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Entrypoint: jalankan migration sebelum start
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
