# Build stage
FROM oven/bun:latest as builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build Astro and server
RUN bun run build

# Production stage
FROM oven/bun:latest

WORKDIR /app

# Install only production dependencies
COPY --from=builder /app/package.json /app/bun.lockb ./
RUN bun install --frozen-lockfile --production

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.astro ./
COPY --from=builder /app/public ./public

# Create non-root user
RUN useradd -m -u 1000 bun
USER bun

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun run src/health-check.ts || exit 1

# Start server
CMD ["bun", "dist/index.js"]
