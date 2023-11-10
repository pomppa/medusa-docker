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
SELECT pg_terminate_backend (pid)
FROM pg_stat_activity
WHERE datname = 'medusa-docker';

DROP DATABASE "medusa-docker";
```

then create it.

### seed

```
$ docker exec medusa-storefront npm run product:seed
```

## more

- new admin: `docker exec medusa-server medusa user --email -p `

- fe to create a customer

```

```
