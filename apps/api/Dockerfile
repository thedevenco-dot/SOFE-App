# Multi-stage Dockerfile for @sofe/api (NestJS)

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage 1: Build dependencies & applications
FROM base AS builder
WORKDIR /app

# Copy root manifest and lockfile
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml tsconfig.base.json ./

# Copy packages and api source
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build shared library first, then API
RUN pnpm --filter @sofe/shared build
RUN pnpm --filter @sofe/api build

# Stage 2: Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Install non-root user for security
USER node

# Copy built artifacts and runtime dependencies
COPY --chown=node:node --from=builder /app/package.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --chown=node:node --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --chown=node:node --from=builder /app/apps/api/dist ./apps/api/dist
COPY --chown=node:node --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 4000

# Health check against verified endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/health || exit 1

CMD ["node", "apps/api/dist/main.js"]

