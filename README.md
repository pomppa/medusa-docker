# local medusa with docker
this repository contains code for starting _sort-of-a_ development environment for [medusajs/medusa](https://github.com/medusajs/medusa).

## requirements
* `docker`
* `docker compose`

### install postgres
```
$ docker pull postgres
$ docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
$ docker start postgres
```

* your local postgres: -u postgres -p postgres, 5432:5432
* database created later will be called: `medusa-docker`

## install medusa backend and storefront
clone this repository: `git clone git@github.com:pomppa/medusa.git`

to build and run
```
$ docker compose up --build
```
* `--force-recreate` to recreate networks
* `-d` ?

to run
```
$ docker compose up
```


## cli commands
connect to postgres
 * `docker run -it --rm --network medusa_default postgres psql -h postgres -U postgres medusa-docker`

## migrate database
it's important you migrate or seed the database before starting backend
```
$ docker exec medusa-server medusa seed --seed-file=backend/data/seed.json
```

alternatively you can edit `docker-compose.yml`
```
command:
    medusa seed -f 'backend/data/seed.json'
```

## more
* to create a new admin with email and password: `docker exec medusa-server medusa user --email -p `

* create a customer
http://localhost:8000/account/login
