# medusa with docker

this repository contains code for starting _sort-of-a_ development environment for [medusajs/medusa](https://github.com/medusajs/medusa).

## requirements

- `docker`
- `docker compose`

## install medusa backend and storefront

clone this repository

```
$ git clone git@github.com:pomppa/medusa.git
```

to build and run

```
$ docker compose up --build
```

to run

```
$ docker compose up
```

## cli commands

connect to postgres

```
$ docker exec -it medusa-postgres-1  psql -h postgres -U postgres
```

database is `medusa-docker`, supply it for connecting to it.

## run migrations

database will be migrated first time you build the images but you can run migrations manually

```
$ docker exec medusa-server npx medusa migrations run
```

### helpfulp commands

to drop `medusa-docker` connect to postgres and terminate active connections and drop table immediately after

```
postgres=# # use following query to terminate connections

SELECT pg_terminate_backend (pid)
FROM pg_stat_activity
WHERE datname = 'medusa-docker';
 pg_terminate_backend


postgres=# DROP DATABASE "medusa-docker";
DROP DATABASE
```

then create it.

### seed

product module first, then backend

```
$ docker exec medusa-storefront npm run product:seed
$ docker exec medusa-server medusa seed --seed-file=/app/backend/data/seed.json
```

### product api

test the product api from backend

```
$ curl -X GET localhost:9000/store/products | python -m json.tool
```

product module provides an api in storefront `localhost:7000/api/product`

## more

- new admin: `docker exec medusa-server medusa user --email -p `

- fe to create a customer

```

```
