# medusa-docker

A Dockerized setup for [Medusa v2](https://medusajs.com) with an optional
Next.js storefront. The backend is a fresh clone of
[`medusajs/medusa-starter-default`](https://github.com/medusajs/medusa-starter-default)
and the storefront is a fresh clone of
[`medusajs/nextjs-starter-medusa`](https://github.com/medusajs/nextjs-starter-medusa),
each wrapped with dev and prod Dockerfiles.

> **Status.** Hobby project. Provides dev containers and prod-capable
> Docker images for Medusa v2. Deploy-time concerns out of scope.

## Requiremeer Compose v2

## Services and ports

| Service    | Port(s)       | Notes                                                          |
| ---------- | ------------- | ------------------------------------------                     |
| backend    | 9000, 5173    | Medusa server; admin at `/app`; Vite HMR on 5173               |
| storefront | 8000          | Next.js 15 (opt-in via `--profile storefront`)                 |
| postgres   | 5432          | `postgres:15-alpine`, data persisted in `postgres_data` volume |
| redis      | 6379          | `redis:7-alpine`                                               |

## Quickstart - backend only (default)

```bash
cp backend/.env.template backend/.env
docker compose up --build
```

The admin dashboard will be served from the backend at
<http://localhost:9000/app>. Create an admin user:

```bash
docker compose exec backend ./node_modules/.bin/medusa user -e admin@example.com -p supersecret
```

Then log in at <http://localhost:9000/app>.

> **First-time setup:** the dev container does **not** auto-seed. To
> load the demo catalogue (regions, products, sales channel,
> publishable key) into the fresh Postgres volume run:
>
> ```bash
> docker compose exec backend yarn seed
> ```
>
> See [Seeding (dev)](#seeding-dev) for why this is opt-in.

## Quickstart - with storefront

The storefront is defined behind a Docker Compose profile, so it is only
started when opted in:

```bash
cp backend/.env.template backend/.env
cp storefront/.env.template storefront/.env
docker compose --profile storefront up --build
# one-time: load the demo catalogue + create a publishable key
docker compose exec backend yarn seed
```

The storefront will be available at <http://localhost:8000>.

Before the storefront can fetch products from the backend you need to
create a publishable API key in the admin dashboard (or grab the one
`yarn seed` just created, listed at
<http://localhost:9000/app/settings/publishable-api-keys>):

1. Go to <http://localhost:9000/app/settings/publishable-api-keys>
2. Create a key and attach it to your sales channel
3. Put the key in `storefront/.env` as `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
4. Recreate the storefront container so it re-reads the `.env` file:

   ```bash
   docker compose --profile storefront up -d --force-recreate storefront
   ```

   A plain `docker compose restart storefront` is **not** enough — Compose
   only loads `env_file` entries at container create time, so a restart
   keeps the old values.

## Production

The prod compose file swaps the backend and storefront to their
multi-stage `Dockerfile.prod` images, drops the dev bind mounts, sets
`restart: always`, and uses a separate pair of `.env.prod` files so
dev-only values never leak into prod. The CI pipeline also publishes
the prod backend image to GHCR on every push to `main` and on version
tags — see [Continuous integration](#continuous-integration) below.

> Run all commands in this README from the repository root.

### One-time prereqs

Copy the templates and fill in every `REPLACE_ME` placeholder:

```bash
cp backend/.env.prod.template backend/.env.prod
cp storefront/.env.prod.template storefront/.env.prod
```

The templates ship with no working secrets — see the comments inside
each file for what every value should be.

### Local smoke test

```bash
cat > backend/.env.prod <<'EOF'
JWT_SECRET=localsmoketest
COOKIE_SECRET=localsmoketest
DATABASE_URL=postgres://postgres:postgres@postgres:5432/medusa-docker
REDIS_URL=redis://redis:6379
STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:9000
AUTH_CORS=http://localhost:8000,http://localhost:9000
EOF

cat > storefront/.env.prod <<'EOF'
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_BACKEND_URL=http://backend:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_REPLACE_ME
NEXT_PUBLIC_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_REGION=us
REVALIDATE_SECRET=localsmoketest
EOF
```

After boot, create an admin user and publishable key (see
[Quickstart - with storefront](#quickstart---with-storefront)), then
replace the `pk_REPLACE_ME` above with the real key and rebuild the
storefront image.

### Build and run

The storefront's `NEXT_PUBLIC_*` values are inlined into the client
bundle by `next build`. Compose's `build.args` only reads them from the
shell environment (not `env_file:`), so source the storefront prod env
before running `up --build`:

```bash
# backend only
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# with storefront - source the prod env first so NEXT_PUBLIC_* inlining works
set -a; . storefront/.env.prod; set +a
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --profile storefront up --build -d
```

`set -a` makes every variable defined in the file automatically exported
to child processes; `set +a` turns that back off. The same file then
serves double duty: source of truth for the runtime `env_file:` in the
container AND source of the shell vars consumed by `build.args:`.

If you change any `NEXT_PUBLIC_*` value afterwards the storefront image
must be **rebuilt** — a container recreate is not enough:

```bash
set -a; . storefront/.env.prod; set +a
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --profile storefront up --build -d --force-recreate storefront
```

### Switching between dev and prod

The dev and prod stacks share `container_name` values (`medusa-backend`,
`medusa-storefront`, `medusa-postgres`, `medusa-redis`) and the
`postgres_data` volume on purpose: on a single host only one stack is
running at a time, and the database contents survive the switch so you
can seed in dev and then boot prod against the same DB for quick sanity
checks.

```bash
# dev -> prod
docker compose --profile storefront down              # keep volumes
set -a; . storefront/.env.prod; set +a
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --profile storefront up --build -d

# prod -> dev
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --profile storefront down
docker compose --profile storefront up -d
```

Add `-v` to either `down` command if you also want to wipe the database.

### Seeding in production

Production **never auto-seeds.** The prod image's CMD is
`medusa db:migrate && yarn start` — it does not run `start.sh` and does
not call `yarn seed`. The `SEED_ON_START` flag is a dev-only mechanism.

If you really need to seed a production database do it explicitly
against a running container:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec backend ./node_modules/.bin/medusa exec ./src/scripts/seed.ts
```

Be aware that `backend/src/scripts/seed.ts` is the demo catalogue from
`medusa-starter-default` (test regions, sample products, dev publishable
key).

## Continuous integration

[`.github/workflows/build-images.yml`](.github/workflows/build-images.yml)
builds and publishes the production backend image to the GitHub
Container Registry (GHCR). It runs on:

- every push to `main`
- any tag matching `v*.*.*`
- manual `workflow_dispatch`

Each run publishes one image, tagged with the branch/tag name, the short
SHA, and (on default-branch pushes) `latest`:

```text
ghcr.io/<owner>/<repo>-backend:<tag>
```

The storefront image is intentionally not built in CI — `next build` in
`nextjs-starter-medusa` fetches the Medusa API during SSG, and this
repo has no publicly reachable backend at CI time. Build the storefront
locally via `docker-compose.prod.yml` when needed, or re-enable a
storefront job once there is a real deploy target.

### Creating a release

```bash
git tag v0.1.0 -m "release notes"
git push origin v0.1.0
```

The workflow publishes `ghcr.io/<owner>/<repo>-backend:v0.1.0` (plus
`:sha-<short>`).

### Consuming the published image

In a deploy-time compose file swap `build:` for `image:`:

```yaml
services:
  backend:
    image: ghcr.io/<owner>/<repo>-backend:latest
    env_file:
      - ./backend/.env.prod
```

Authenticate the deploy host with `docker login ghcr.io` using a
personal access token with `read:packages`, or rely on IAM if you deploy
from another GitHub-aware runner.

## Common tasks

Run migrations manually:

```bash
docker compose exec backend ./node_modules/.bin/medusa db:migrate
```

### Seeding (dev)

Automatic seeding is **off by default**. The upstream seed script
([`backend/src/scripts/seed.ts`](backend/src/scripts/seed.ts), inherited
from `medusa-starter-default`) is not idempotent — running it a second
time against an already-seeded database crashes on duplicate regions
(`Countries with codes ... are already assigned to a region`). Leaving
it off by default keeps `docker compose up -d --build` safe to run
repeatedly.

One-time bootstrap on a fresh database — either set the flag and
recreate the backend, or just run the seed script directly:

```bash
# option A: let start.sh seed once on the next boot
# backend/.env
SEED_ON_START=true
```

```bash
docker compose up -d --force-recreate backend
# then flip it back off to avoid the duplicate-region crash on the next recreate
# backend/.env -> SEED_ON_START=false (or remove the line)
docker compose up -d --force-recreate backend
```

```bash
# option B: seed once against a running container, no flag flipping
docker compose exec backend yarn seed
```

Both paths run the same `yarn seed` command. `SEED_ON_START` only gates
the automatic invocation inside
[`backend/start.sh`](backend/start.sh); `docker compose exec backend yarn seed`
is always available. Production never auto-seeds (see above).

If you want to iterate on `backend/src/scripts/seed.ts` itself, wipe
the database between runs so the script can start from a clean slate:

```bash
docker compose down -v    # also nukes postgres_data
docker compose up -d --build
docker compose exec backend yarn seed
```

Tail logs:

```bash
docker compose logs -f backend
```

Connect to Postgres:

```bash
docker compose exec postgres psql -U postgres -d medusa-docker
```

Drop and recreate the database:

```bash
docker compose exec postgres psql -U postgres -c "DROP DATABASE \"medusa-docker\";"
docker compose exec postgres psql -U postgres -c "CREATE DATABASE \"medusa-docker\";"
docker compose exec backend ./node_modules/.bin/medusa db:migrate
```

Stop everything:

```bash
docker compose down              # keep the database volume
docker compose down -v           # also wipe postgres_data and *_node_modules
```

## Troubleshooting

### Stale `*_node_modules` volumes

The `backend_node_modules` / `storefront_node_modules` named volumes
cache dependencies across container recreates so bind-mount dev is
fast. If you bump a dependency version and the container suddenly acts
like it is running the old code, the cached volume is the suspect:

```bash
docker compose --profile storefront down -v
docker compose --profile storefront up --build -d
```

### Admin dashboard: "Failed to fetch dynamically imported module"

A stale browser tab will 404 on Vite-hashed dep URLs after the backend
restarts. Hard-refresh the admin tab (`⌘⇧R` / `Ctrl+Shift+R`) or clear
site data for `localhost:9000`. If that doesn't help, wipe Vite's
cache inside the container:

```bash
docker compose exec backend sh -c "rm -rf node_modules/.vite .medusa/admin/.vite"
docker compose restart backend
```

### `yarn.lock` in Yarn Classic v1 format

Both apps use Yarn Berry v4 via `.yarn/releases/yarn-4.12.0.cjs`. If
install fails with `This package doesn't seem to be present in your
lockfile`, the lockfile is in the old Classic v1 format — regenerate:

```bash
(cd backend    && CI= node .yarn/releases/yarn-4.12.0.cjs install --no-immutable)
(cd storefront && CI= node .yarn/releases/yarn-4.12.0.cjs install --no-immutable)
```

### Prod storefront build fails with `ECONNREFUSED`

`nextjs-starter-medusa` fetches categories, products and collections at
`next build` time, so `NEXT_PUBLIC_MEDUSA_BACKEND_URL` must be reachable
from the build container. Two common failure modes:

1. You ran `up --build storefront` without starting the backend first.
   Bring postgres, redis and backend up on their own first, then build
   the storefront:

   ```bash
   set -a; . storefront/.env.prod; set +a
   docker compose -f docker-compose.yml -f docker-compose.prod.yml \
     up --build -d postgres redis backend
   docker compose -f docker-compose.yml -f docker-compose.prod.yml \
     --profile storefront up --build -d storefront
   ```

2. The publishable key in `storefront/.env.prod` does not exist in the
   prod Postgres database. Create one via the admin UI and paste it
   into `storefront/.env.prod` before re-running `up --build storefront`.

### Host compose flags and the override file

`docker-compose.override.yml` is auto-loaded only when you do **not**
pass any `-f` flags. If you pass `-f docker-compose.yml` explicitly,
Compose will ignore the override file and you will not get the host
port publishings (`9000`, `5173`, `8000`, ...) or the dev bind
mounts. Either omit `-f` or pass both files:

```bash
# good (auto-loads override)
docker compose up -d

# also good (explicit)
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d

# will NOT publish ports
docker compose -f docker-compose.yml up -d
```

## Layout

```txt
medusa-docker/
├── backend/                    # medusa-starter-default, patched for Docker
│   ├── Dockerfile              # development image
│   ├── Dockerfile.prod         # multi-stage production image
│   ├── start.sh                # migrate + (optional) seed + dev
│   └── medusa-config.ts        # databaseDriverOptions.ssl=false, Vite admin config
├── storefront/                 # nextjs-starter-medusa
│   ├── Dockerfile
│   └── Dockerfile.prod
├── docker-compose.yml          # base: postgres, redis, backend, (storefront: profile)
├── docker-compose.override.yml # dev: ports + bind mounts (auto-loaded)
└── docker-compose.prod.yml     # prod: *.prod Dockerfiles, restart policies
```
