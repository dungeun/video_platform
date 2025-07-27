# Build stage
FROM node:18-alpine AS builder

# Install dependencies for building
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable
RUN corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
ENV NEXT_TELEMETRY_DISABLED 1
# Generate Prisma client before build
RUN pnpm prisma generate
RUN pnpm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install dependencies for prisma
RUN apk add --no-cache openssl bash

# Copy built application first
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0 ./node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Create startup script
COPY <<'EOF' /app/start.sh
#!/bin/bash
set -e

echo "=== Starting application initialization ==="
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."

# Run migrations
echo "Running database migrations..."
cd /app && npx prisma migrate deploy 2>&1 || {
    echo "Migration deploy failed, trying to generate client..."
    npx prisma generate 2>&1 || echo "Generate also failed"
}

echo "Starting application..."
exec node server.js
EOF

RUN chmod +x /app/start.sh

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

ENV PORT 3000

# Start the application with migration
CMD ["/app/start.sh"]