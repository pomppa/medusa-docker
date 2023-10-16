FROM node:20.8.0

WORKDIR /app/backend

COPY package.json .

COPY tsconfig.server.json .

COPY tsconfig.json .

COPY tsconfig.spec.json .

COPY data/seed.json .

COPY data/seed-onboarding.json .

RUN apt-get update

RUN apt-get install -y python-is-python3

RUN npm install -g npm@latest

RUN npm install -g @medusajs/medusa-cli@latest

RUN npm install --loglevel=error

COPY . .

