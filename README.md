# medusa with docker

this repository contains a starter docker template for [medusajs/medusa](https://github.com/medusajs/medusa). it has built-in support for serverless [product module](https://docs.medusajs.com/modules/products/serverless-module) & next.js starter [storefront](https://docs.medusajs.com/starters/nextjs-medusa-starter).

## requirements

- `docker`
- `docker-compose`

## install medusa backend and storefront

clone this repository

```
$ git clone git@github.com:pomppa/medusa-docker.git
```

add env variables

```
$ cd storefront
$ cp .env.template .env
```

add backend url

```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://medusa-server:9000
```

if you run it for the first time, you need to build the images

```
$ docker-compose up --build
```

after building the images you can run with

```
$ docker-compose up [-d]
```

### development mode

following ports are assigned (locahost):

- storefront: 8000
- backend: 9000
- admin: 7001
- postgres: 5432
- redis: 6379 (redis://redis)

### cli commands

connect to postgres

```
$ docker exec -it medusa-postgres-1  psql -h postgres -U postgres
```

database is `medusa-docker`, append to above command for connecting to it.

### about migrations

- database will be migrated first time you build the images

- postgres is considered remote as connection string does not contain `localhost`
- bug in medusa core prevents running some migrations as custom driver options are not applied
- use `?sslmode=false` or similar in connection string

```
$ docker exec medusa-server npx medusa migrations run
```

### helpfulp commands

to drop `medusa-docker` connect to postgres and terminate active connections, then drop table immediately after

```
SELECT pg_terminate_backend (pid)
FROM pg_stat_activity
WHERE datname = 'medusa-docker';

# to drop
DROP DATABASE "medusa-docker";

# to create
CREATE DATABASE "medusa-docker";
```

### seed

you can seed the database with test data using two seeds: backend & product module

```
$ docker exec medusa-server medusa seed --seed-file=/app/backend/data/seed.json

$ docker exec medusa-storefront npm run product:seed
```

backend seed creates an admin user: `admin@medusa-test.com` / `supersecret`

optionally you can create a new one with

```
$ docker exec medusa-server medusa user --email email@example.com -p supersecret
```

### product api

test the product api from backend

```
$ curl -X GET localhost:9000/store/products | python -m json.tool
```

## running in production mode (wip / untested)

build production images from both docker-compose files

```
$ docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

add environment variables in storefront `.env`

```
NEXT_PUBLIC_BASE_URL=http://localhost:80
POSTGRES_URL='postgres://postgres:postgres@postgres:5432/medusa-docker'
```

### production mode

following ports are assigned (localhost)

- storefront: 80
- backend: 9000
- admin panel: 9000 (in path `/app`)
- postgres: 5432
- redis: 6379 (redis://redis)
