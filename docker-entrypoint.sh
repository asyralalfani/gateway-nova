#!/bin/sh
# docker-entrypoint.sh
# Run database migrations before starting the app
set -e

echo "▶ Running database migrations..."
npx prisma migrate deploy

echo "▶ Starting the app..."
exec "$@"
