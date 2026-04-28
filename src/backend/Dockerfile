FROM node:22-slim AS builder

WORKDIR /app

# Cài đặt pnpm trên Debian-based image
RUN npm install -g pnpm

COPY package*.json ./
RUN pnpm install

COPY . .
RUN pnpm run build

FROM node:22-slim

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["pnpm", "start:prod"]
