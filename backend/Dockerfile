FROM node:20.8.0-alpine as deps
WORKDIR /app/backend

# copy required files
COPY package.json .
COPY yarn.lock .
COPY develop.sh .

# copy optional seed files
COPY data/seed.json .
COPY data/seed-onboarding.json .

# install deps 
RUN yarn install --frozen-lockfile

# intermediate build stage
FROM node:20.8.0-alpine as builder
WORKDIR /app/backend

# copy from deps 
COPY --from=deps /app/backend/node_modules /app/backend/node_modules

# install python, medusa-cli and npx
RUN apk update
RUN apk add python3
RUN yarn global add @medusajs/medusa-cli@latest
RUN yarn global add npx

# copy project files to current workdir
COPY . .

ENTRYPOINT ["/bin/sh", "./develop.sh", "develop"]