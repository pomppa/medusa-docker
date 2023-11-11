FROM node:18-alpine3.16 as deps

WORKDIR /app/storefront

COPY package.json .
COPY yarn.lock .

RUN yarn install --frozen-lockfile

# BUILD

FROM node:18-alpine3.16 as runner

WORKDIR /app/storefront

COPY --from=deps /app/storefront/node_modules /app/storefront/node_modules

# COPY ./storefront /app/storefront

ENTRYPOINT [ "yarn", "dev" ]
