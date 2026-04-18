FROM node:20-alpine

WORKDIR /app/storefront

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases .yarn/releases

RUN yarn install

COPY . .

EXPOSE 8000

CMD ["yarn", "dev"]
