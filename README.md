# Gateway Nova

> Self-hosted internal homepage untuk mendokumentasikan tools tim. Mirip [gethomepage.dev](https://gethomepage.dev/), tapi dengan UI editor sehingga anggota tim bisa menambah & mengedit langsung dari browser.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)

## ✨ Fitur

- 📋 **Daftar tools terorganisir** dalam kategori
- 🔍 **Search & filter** by nama, tag, atau kategori
- ✏️ **UI editor** — tambah/edit tanpa edit file config
- 🎨 **Dark mode** otomatis mengikuti sistem
- 🐳 **Docker-ready** — deploy dengan satu command
- 🔐 **Auth opsional** — pakai kalau perlu, skip kalau di internal network
- 💾 **SQLite** — tidak butuh database server terpisah

## 🚀 Quick Start (Production)

```bash
# Clone repo
git clone <repo-url>
cd gateway-nova

# Copy env file
cp .env.example .env
# Edit .env sesuai kebutuhan

# Build & jalankan
docker compose up -d

# Cek logs
docker compose logs -f
```

Aplikasi tersedia di `http://localhost:3000`.

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
├── data/                # SQLite DB (gitignored, mounted volume)
├── Dockerfile
├── docker-compose.yml
└── ...
```

Detail di [ARCHITECTURE.md](./ARCHITECTURE.md).

## ⚙️ Konfigurasi

Edit `.env` untuk mengatur:

```env
# Database (default: SQLite di folder data/)
DATABASE_URL="file:/data/app.db"

# Auth (set true untuk enable login)
AUTH_ENABLED=false
AUTH_SECRET="generate-random-32-chars"

# URL public aplikasi (jika auth on)
NEXTAUTH_URL="https://homepage.tim.internal"
```

Detail semua env var di [ARCHITECTURE.md](./ARCHITECTURE.md#environment-variables).

## 🐳 Deployment

### Docker Compose (rekomendasi)

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
    environment:
      - DATABASE_URL=file:/data/app.db
      - AUTH_ENABLED=false
    restart: unless-stopped
```

### Behind Reverse Proxy

Contoh dengan Traefik:

```yaml
services:
  app:
    # ... config di atas
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.homepage.rule=Host(`homepage.tim.internal`)"
      - "traefik.http.services.homepage.loadbalancer.server.port=3000"
```

## 💾 Backup

SQLite file ada di `./data/app.db`. Backup sederhana:

```bash
# Manual backup
cp ./data/app.db ./backups/app-$(date +%F).db

# Cron job harian
0 2 * * * cd /path/to/gateway-nova && cp data/app.db backups/app-$(date +\%F).db
```

Untuk backup yang konsisten saat aplikasi running, pakai SQLite backup API:

```bash
docker compose exec app sqlite3 /data/app.db ".backup /data/backup.db"
```

## 📖 Dokumentasi

- [PROJECT.md](./PROJECT.md) — overview, scope, roadmap
- [ARCHITECTURE.md](./ARCHITECTURE.md) — keputusan teknis & arsitektur
- [CONTRIBUTING.md](./CONTRIBUTING.md) — panduan development
- [CLAUDE.md](./CLAUDE.md) — panduan untuk AI assistant (Claude Code)

## 📝 License

MIT
