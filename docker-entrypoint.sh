#!/bin/sh
# docker-entrypoint.sh
# Jalankan migration database sebelum start aplikasi
set -e

echo "▶ Menjalankan database migration..."
npx prisma migrate deploy

echo "▶ Memulai aplikasi..."
exec "$@"
