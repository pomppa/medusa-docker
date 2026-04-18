#!/bin/sh
set -e

echo "Running database migrations..."
./node_modules/.bin/medusa db:migrate

# Seeding is opt-in. The default seed script (./src/scripts/seed.ts,
# from medusa-starter-default) is NOT idempotent - it crashes on an
# already-seeded DB with "Countries ... are already assigned to a
# region". Keep the default off so container recreates are safe, and
# let developers set SEED_ON_START=true explicitly for the one-time
# bootstrap on a fresh DB.
SEED_ON_START="${SEED_ON_START:-false}"
case "$SEED_ON_START" in
  true|1|yes|on)
    echo "Seeding database (skipped on failure)..."
    yarn seed || echo "seed skipped"
    ;;
  *)
    echo "Skipping seed (SEED_ON_START=$SEED_ON_START)"
    ;;
esac

echo "Starting Medusa development server..."
exec yarn dev
