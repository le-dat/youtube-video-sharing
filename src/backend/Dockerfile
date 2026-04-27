FROM node:22-alpine As development

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

CMD ["pnpm", "start:dev"]
