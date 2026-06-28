# Gateway Nova

> Self-hosted internal homepage untuk mendokumentasikan tools tim. Mirip [gethomepage.dev](https://gethomepage.dev/), tapi dengan UI editor sehingga anggota tim bisa menambah & mengedit langsung dari browser.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)

## ✨ Fitur

- 📋 **Daftar tools terorganisir** dalam kategori
- 🔍 **Search & filter** by nama, tag, atau kategori
- ✏️ **UI editor** — tambah/edit tanpa edit file config
- 🎨 **Dark mode** otomatis mengikuti sistem
- 🐳 **Docker-ready** — deploy dengan satu command (app + PostgreSQL)
- 🔐 **Auth opsional** — pakai kalau perlu, skip kalau di internal network
- 🔌 **Port customizable** — `APP_PORT` & `POSTGRES_PORT` lewat `.env`, default non-standard supaya tidak bentrok

## 🚀 Quick Start (Production)

```bash
# Clone repo
git clone https://github.com/asyralalfani/gateway-nova.git
cd gateway-nova

# Copy env file
cp .env.example .env
# Edit .env sesuai kebutuhan

# Build & jalankan
docker compose up -d

# Cek logs
docker compose logs -f
```

Aplikasi tersedia di `http://localhost:3100` (port default; ubah `APP_PORT` di `.env` kalau mau berbeda).

## 🛠 Development

```bash
# Install pnpm dulu jika belum
npm install -g pnpm

# Install deps
pnpm install

# Setup database
cp .env.example .env
pnpm prisma migrate dev
pnpm prisma db seed

# Jalankan dev server
pnpm dev
```

Detail lengkap di [CONTRIBUTING.md](./CONTRIBUTING.md).

## 📂 Struktur Project

```
gateway-nova/
├── prisma/              # Database schema & migrations
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   └── lib/             # Business logic & utilities
├── data/postgres/       # PostgreSQL data (gitignored, mounted volume)
├── Dockerfile
├── docker-compose.yml
└── ...
```

Detail di [ARCHITECTURE.md](./ARCHITECTURE.md).

## ⚙️ Konfigurasi

Copy `.env.example` → `.env`, lalu sesuaikan. Variabel utama:

```env
# ===== Port di host =====
# Default non-standard supaya tidak bentrok dengan service lain.
APP_PORT=3100
POSTGRES_PORT=5433

# ===== Database (PostgreSQL) =====
POSTGRES_USER=homepage
POSTGRES_PASSWORD=homepage
POSTGRES_DB=homepage

# Untuk akses dari host (Prisma Studio, migrate dev) → pakai POSTGRES_PORT.
# Untuk akses antar container (app → db) → docker-compose pakai port internal 5432.
DATABASE_URL="postgresql://homepage:homepage@localhost:5433/homepage?schema=public"

# ===== Auth (opsional) =====
AUTH_ENABLED=false
AUTH_SECRET=""                              # wajib kalau AUTH_ENABLED=true
NEXTAUTH_URL="http://localhost:3100"        # sesuaikan dengan APP_PORT
```

> **Catatan port**: kalau ubah `APP_PORT`, ikut update `NEXTAUTH_URL`.
> Kalau ubah `POSTGRES_PORT`, ikut update port di `DATABASE_URL` (host-side).
> Port internal container (3000 untuk app, 5432 untuk postgres) tetap, tidak berubah.

Detail semua env var di [ARCHITECTURE.md](./ARCHITECTURE.md#environment-variables).

## 🐳 Deployment

### Docker Compose (rekomendasi)

File `docker-compose.yml` di repo sudah lengkap (app + PostgreSQL + healthcheck + resource limit). Cukup:

```bash
cp .env.example .env
# Edit APP_PORT / POSTGRES_PORT / password sesuai kebutuhan
docker compose up -d --build
docker compose logs -f app
```

PostgreSQL di-bind ke `127.0.0.1` saja (tidak ekspos publik). App komunikasi ke db lewat docker network (`db:5432`), jadi `POSTGRES_PORT` hanya relevan untuk akses dari host.

### Behind Reverse Proxy

Contoh dengan Traefik (port internal container tetap 3000):

```yaml
services:
  app:
    # ... config di atas
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.gateway-nova.rule=Host(`gateway.tim.internal`)"
      - "traefik.http.services.gateway-nova.loadbalancer.server.port=3000"
```

## 💾 Backup

Data PostgreSQL ada di `./data/postgres/` (mounted volume). Untuk backup konsisten saat aplikasi running, pakai `pg_dump`:

```bash
# Manual backup (ke file .dump format custom — bisa di-restore dengan pg_restore)
docker compose exec -T db pg_dump -U homepage -F c homepage > backups/homepage-$(date +%F).dump

# Restore
docker compose exec -T db pg_restore -U homepage -d homepage --clean < backups/homepage-2026-06-28.dump

# Cron job harian (jam 02:00)
0 2 * * * cd /path/to/gateway-nova && docker compose exec -T db pg_dump -U homepage -F c homepage > backups/homepage-$(date +\%F).dump
```

Service `backup` siap-pakai sudah disiapkan (commented out) di `docker-compose.yml` — uncomment kalau mau auto-backup harian + retention 30 hari.

## 📖 Dokumentasi

- [PROJECT.md](./PROJECT.md) — overview, scope, roadmap
- [ARCHITECTURE.md](./ARCHITECTURE.md) — keputusan teknis & arsitektur
- [CONTRIBUTING.md](./CONTRIBUTING.md) — panduan development
- [CLAUDE.md](./CLAUDE.md) — panduan untuk AI assistant (Claude Code)

## 📝 License

MIT
