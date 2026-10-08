# Build from the repo root:  docker build -f apps/web/Dockerfile .
FROM node:24-slim AS base
ENV HUSKY=0 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    TURBO_TELEMETRY_DISABLED=1 \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# --- 1. Prune the monorepo to what @hallway/web needs ---
FROM base AS prepare
COPY . .
RUN pnpm dlx turbo@2.11.7 prune @hallway/web --docker

# --- 2. Install and build (Next.js standalone output) ---
FROM base AS builder
COPY --from=prepare /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=prepare /app/out/full/ .
RUN pnpm turbo run build --filter=@hallway/web \
 && mkdir -p apps/web/public

# --- 3. Runtime: only the traced standalone server + static assets ---
FROM node:24-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app
COPY --from=builder --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
