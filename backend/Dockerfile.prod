FROM node:20.8.0-alpine as deps
WORKDIR /app/backend

# copy required files
COPY package.json .
COPY yarn.lock .

# install deps 
RUN yarn install --frozen-lockfile

# build stage
FROM node:18-alpine3.16 as builder
WORKDIR /app/backend

# copy node_modules from deps
COPY --from=deps /app/backend/node_modules /app/backend/node_modules

# install python and medusa-cli
RUN apk update
RUN apk add python3
RUN yarn global add @medusajs/medusa-cli@latest

# copy project files to current workdir
COPY . .

# run build
RUN yarn build

# run medusa start
ENTRYPOINT ["/bin/sh", "./develop.sh", "start"]