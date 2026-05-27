FROM node:24-alpine AS base
RUN npm install -g bun

FROM base AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM base AS runner
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --from=builder /app/dist ./dist

RUN addgroup -S app && adduser -S -G app app
USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun run src/health-check.ts || exit 1

CMD ["bun", "dist/index.js"]
