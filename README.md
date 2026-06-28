# Gateway Nova

> Self-hosted internal homepage for documenting team tools. Similar to [gethomepage.dev](https://gethomepage.dev/), but with a built-in editor UI so team members can add and edit entries directly from the browser.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-brightgreen.svg)

## ✨ Features

- 📋 **Organized tool list** grouped by category
- 🔍 **Search & filter** by name, tag, or category
- ✏️ **Editor UI** — add/edit without touching config files
- 🎨 **Dark mode** follows the system theme automatically
- 🐳 **Docker-ready** — deploy with a single command (app + PostgreSQL)
- 🔐 **Optional auth** — enable when needed, skip on a trusted internal network
- 🔌 **Customizable ports** — `APP_PORT` & `POSTGRES_PORT` via `.env`, defaults are non-standard to avoid clashes
- 🟢 **Status pings** — optional sidecar polls every tool URL and shows live up/down dots
- ⭐ **Personal favorites** — pin your most-used tools to the top (per-browser, no account required)

## 🚀 Quick Start (Production)

```bash
# Clone the repo
git clone https://github.com/asyralalfani/gateway-nova.git
cd gateway-nova

# Copy the env file
cp .env.example .env
# Edit .env to taste

# Build & run
docker compose up -d

# Tail the logs
docker compose logs -f
```

The app is available at `http://localhost:3100` (default port; change `APP_PORT` in `.env` if needed).

## 🛠 Development

```bash
# Install pnpm first if you haven't
npm install -g pnpm

# Install deps
pnpm install

# Set up the database
cp .env.example .env
pnpm prisma migrate dev
pnpm prisma db seed

# Run the dev server
pnpm dev
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

## 📂 Project Structure

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

More detail in [ARCHITECTURE.md](./ARCHITECTURE.md).

## ⚙️ Configuration

Copy `.env.example` → `.env`, then adjust. Key variables:

```env
# ===== Host ports =====
# Non-standard defaults to avoid clashes with other services.
APP_PORT=3100
POSTGRES_PORT=5433

# ===== Database (PostgreSQL) =====
POSTGRES_USER=homepage
POSTGRES_PASSWORD=homepage
POSTGRES_DB=homepage

# For host access (Prisma Studio, migrate dev) → use POSTGRES_PORT.
# For container-to-container (app → db) → docker-compose uses internal port 5432.
DATABASE_URL="postgresql://homepage:homepage@localhost:5433/homepage?schema=public"

# ===== Auth (optional) =====
AUTH_ENABLED=false
AUTH_SECRET=""                              # required when AUTH_ENABLED=true
NEXTAUTH_URL="http://localhost:3100"        # match APP_PORT
```

> **Port notes**: if you change `APP_PORT`, also update `NEXTAUTH_URL`.
> If you change `POSTGRES_PORT`, also update the port in `DATABASE_URL` (host side).
> Internal container ports (3000 for the app, 5432 for postgres) stay the same.

Full env var reference in [ARCHITECTURE.md](./ARCHITECTURE.md#environment-variables).

## 🐳 Deployment

### Docker Compose (recommended)

The `docker-compose.yml` in the repo is complete (app + PostgreSQL + healthchecks + resource limits). Just:

```bash
cp .env.example .env
# Edit APP_PORT / POSTGRES_PORT / passwords as needed
docker compose up -d --build
docker compose logs -f app
```

PostgreSQL is bound to `127.0.0.1` only (not exposed publicly). The app talks to the db over the docker network (`db:5432`), so `POSTGRES_PORT` only matters for host access.

### Service status pings (optional)

A sidecar container (`pinger`) polls each tool URL on a schedule and stores the last status on the `Tool` record. Tool cards show a small dot: green for up, red for down, hidden when never checked.

Enable it by setting `PING_SECRET` in `.env`:

```bash
# Generate a random secret
echo "PING_SECRET=$(openssl rand -hex 24)" >> .env
docker compose up -d --build pinger
```

Tunables in `.env`:
- `PING_ENABLED` — `false` disables the endpoint entirely (default `true`)
- `PING_INTERVAL_SECONDS` — how often to sweep (default `300`)
- `PING_TIMEOUT_MS` — per-URL timeout (default `5000`)

To trigger a sweep manually (e.g. right after adding a new tool):

```bash
curl -X POST -H "Authorization: Bearer $PING_SECRET" \
  http://localhost:3100/api/ping/run
# Returns: { ok, total, up, down, durationMs }
```

Without the `pinger` sidecar you can also call the endpoint from system cron or any external scheduler.

### Updating in production

A `deploy.sh` script bundles the standard update workflow: pull → check for new env vars → back up the database → rebuild → restart → wait for `/api/health`.

```bash
./deploy.sh                 # full flow
./deploy.sh --skip-backup   # skip the pg_dump step (faster, riskier)
./deploy.sh --no-pull       # skip git pull (when CI already updated the tree)
./deploy.sh --help          # usage
```

Exits 0 on success, 1 on preflight failure, 2 on deploy failure (and prints the last 30 lines of app logs). Backups land in `backups/` and a rollback hint is printed when the deploy completes.

### Behind a Reverse Proxy

Example with Traefik (internal container port stays at 3000):

```yaml
services:
  app:
    # ... config above
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.gateway-nova.rule=Host(`gateway.team.internal`)"
      - "traefik.http.services.gateway-nova.loadbalancer.server.port=3000"
```

## 💾 Backup

PostgreSQL data lives in `./data/postgres/` (mounted volume). For consistent backups while the app is running, use `pg_dump`:

```bash
# Manual backup (custom format .dump — restore with pg_restore)
docker compose exec -T db pg_dump -U homepage -F c homepage > backups/homepage-$(date +%F).dump

# Restore
docker compose exec -T db pg_restore -U homepage -d homepage --clean < backups/homepage-2026-06-28.dump

# Daily cron (02:00)
0 2 * * * cd /path/to/gateway-nova && docker compose exec -T db pg_dump -U homepage -F c homepage > backups/homepage-$(date +\%F).dump
```

A ready-to-use `backup` service is already in `docker-compose.yml` (commented out) — uncomment it for automatic daily backups with 30-day retention.

## 📖 Documentation

- [PROJECT.md](./PROJECT.md) — overview, scope, roadmap
- [ARCHITECTURE.md](./ARCHITECTURE.md) — technical decisions & architecture
- [CONTRIBUTING.md](./CONTRIBUTING.md) — development guide
- [CLAUDE.md](./CLAUDE.md) — guide for AI assistants (Claude Code)

## 📝 License

MIT
