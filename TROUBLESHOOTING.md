# Troubleshooting

Runtime problems and how to resolve them. Most issues come from one of:
- Production containers running an older image than what's in git
- Missing or mismatched env vars between containers
- A migration that didn't reach the production database

If you don't know where to start, run the **[Quick diagnostic](#quick-diagnostic)** section first.

---

## Status pings not showing in production

**Symptom:** No green/red status pills on tool cards in production. Pinger logs `ping run failed` or `HTTP 500`.

### Quick diagnostic

Run these on the production host, in order. Stop at the first one that explains the symptom.

```bash
cd /path/to/gateway-nova

# 1. Is the code up to date?
git log --oneline -5
# You should see commits da72ed4 (status pings) and b56be7d (PING_SECRET to app)

# 2. Is PING_SECRET set in .env?
grep "^PING_SECRET=" .env
# Must return: PING_SECRET=<hex string>  (not empty, not just `PING_SECRET=`)

# 3. Does the app container actually see PING_SECRET?
docker compose exec app env | grep PING
# Must show PING_SECRET with the same value as in .env

# 4. Is the pinger container running?
docker compose ps pinger
# Status must be "Up"

# 5. Did the DB migration apply?
docker compose exec -T db psql -U homepage -d homepage \
  -c '\d "Tool"' | grep -E "status|checked"
# Must show columns: status, statusCode, responseMs, checkedAt

# 6. Direct curl to the endpoint — what does it actually return?
PING_SECRET=$(grep "^PING_SECRET=" .env | cut -d= -f2-)
curl -i -X POST -H "Authorization: Bearer $PING_SECRET" \
  "http://localhost:${APP_PORT:-3100}/api/ping/run"
```

The body of the curl response (step 6) tells you exactly which case you're in:

| Response | Root cause | Fix |
|---|---|---|
| `{"ok":true,"total":N,...}` | Endpoint works — the issue is somewhere else (UI cache, pinger schedule) | Refresh the browser; wait for the next pinger sweep |
| `{"ok":false,"error":"PING_SECRET not configured"}` | App container env doesn't have `PING_SECRET` | See **[Fix A](#fix-a-app-cant-see-ping_secret)** |
| `{"ok":false,"error":"Unauthorized"}` | Pinger and app are using different secrets | See **[Fix B](#fix-b-secret-mismatch)** |
| `{"ok":false,"error":"Pinger disabled"}` | `PING_ENABLED=false` | Set `PING_ENABLED=true` in `.env`, recreate the app container |
| 500 with empty body or a Prisma error in `docker compose logs app` | Migration `add_tool_status` didn't apply to the production DB | See **[Fix C](#fix-c-migration-didnt-apply)** |
| 404 / route not found | The app container is running old code | See **[Fix D](#fix-d-stale-image)** |

### Fix A: app can't see PING_SECRET

The variable is in `.env` but `docker compose exec app env | grep PING` returns nothing.

```bash
# Make sure the var is in .env
grep -q "^PING_SECRET=" .env || echo "PING_SECRET=$(openssl rand -hex 24)" >> .env

# Force a recreate — restart alone does NOT re-read .env into a container's env.
docker compose up -d --force-recreate app pinger

# Verify
docker compose exec app env | grep PING_SECRET
```

### Fix B: secret mismatch

The app container has one `PING_SECRET`, the pinger another. They must match.

```bash
docker compose exec app env | grep PING_SECRET
docker compose exec pinger env | grep PING_SECRET
# If different → both should read from .env. Recreate both:
docker compose up -d --force-recreate app pinger
```

### Fix C: migration didn't apply

The container starts via `docker-entrypoint.sh` which runs `prisma migrate deploy`. If that step failed silently, the columns are missing in the DB.

```bash
# Apply pending migrations manually
docker compose exec app npx prisma migrate deploy

# Verify
docker compose exec -T db psql -U homepage -d homepage \
  -c '\d "Tool"' | grep -E "status|checked"
```

If `migrate deploy` errors out, share the full error message — it usually points at a missing migration file or a permission issue.

### Fix D: stale image

The app container is running an image built before the status-pings feature landed. `git pull` alone does not rebuild — Docker still uses the cached image.

Go straight to the **[Full rebuild](#full-rebuild)** below.

---

## Full rebuild

Use this when:
- A `docker compose up -d --build` didn't pick up the latest code
- Containers are still running images with old names (e.g. `team-homepage` instead of `gateway-nova`)
- You're not sure what state production is in and want a clean slate

```bash
cd /path/to/gateway-nova

# 1. Pull the latest code
git pull origin main

# 2. Make sure required env vars are present
grep -q "^PING_SECRET=" .env || echo "PING_SECRET=$(openssl rand -hex 24)" >> .env
grep -q "^PING_ENABLED=" .env || echo "PING_ENABLED=true" >> .env
grep -q "^PING_TIMEOUT_MS=" .env || echo "PING_TIMEOUT_MS=5000" >> .env

# 3. Back up the database
mkdir -p backups
docker compose exec -T db pg_dump -U homepage -F c homepage \
  > "backups/homepage-pre-rebuild-$(date +%F-%H%M).dump"

# 4. Stop everything and remove the old image
docker compose down
docker image rm gateway-nova:latest team-homepage:latest 2>/dev/null || true

# 5. Build from scratch and start
docker compose build --no-cache app
docker compose up -d

# 6. Wait for the app to be healthy (migrations auto-apply during startup)
sleep 10
docker compose ps

# 7. Verify everything
docker compose exec app env | grep PING
docker compose exec -T db psql -U homepage -d homepage -c '\d "Tool"' | grep -E "status|checked"

# 8. Trigger one sweep to seed status data
PING_SECRET=$(grep "^PING_SECRET=" .env | cut -d= -f2-)
curl -X POST -H "Authorization: Bearer $PING_SECRET" \
  "http://localhost:${APP_PORT:-3100}/api/ping/run"
```

Step 4 is the important difference vs a normal redeploy: removing the image guarantees the next build starts cold and the new container starts from the freshly-built image.

---

## Other common issues

### App restarts in a loop on first deploy
Usually a database problem. Tail the app logs while it tries to start:
```bash
docker compose logs -f app
```
- `Can't reach database server` → the `db` container isn't healthy yet. `docker compose ps db` should show `Up (healthy)`. If not, check `docker compose logs db`.
- `relation "Tool" does not exist` → migrations didn't run. `docker compose exec app npx prisma migrate deploy`.

### Port already in use
```
Error: Bind for 0.0.0.0:3100 failed: port is already allocated
```
Something else on the host (often an old container we forgot to clean up) is holding the port.
```bash
docker ps -a | grep 3100   # find the offending container
docker rm -f <name>        # remove it
# Or change APP_PORT in .env to something free
```

### 502 / 504 from a reverse proxy
The reverse proxy (Traefik / Nginx) can reach the host but the app container behind it is down or unhealthy.
```bash
docker compose ps                                 # is app "Up (healthy)"?
curl -fsS http://localhost:${APP_PORT:-3100}/api/health  # does the app respond directly?
```
If the app responds directly but the proxy returns 502, the proxy config is targeting the wrong port or hostname — the app's internal port is `3000`, not `APP_PORT`.

### `.env` change doesn't take effect
`docker compose restart` does **not** re-read `.env` into the container's environment. Use:
```bash
docker compose up -d --force-recreate <service>
```

### Backup or restore fails
- For backup: make sure the `db` container is `Up (healthy)` first.
- For restore: drop the existing data first or use `pg_restore --clean`.
```bash
docker compose exec -T db pg_restore -U homepage -d homepage --clean \
  < backups/homepage-2026-06-28.dump
```

---

## Still stuck?

Share these three outputs and the problem is almost always identifiable from them:

```bash
docker compose ps
docker compose logs --tail=80 app
docker compose logs --tail=30 pinger
```
