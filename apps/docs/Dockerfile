# Build from the repo root:  docker build -f apps/docs/Dockerfile .
FROM node:24-slim AS base
ENV HUSKY=0 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    TURBO_TELEMETRY_DISABLED=1 \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# --- 1. Prune the monorepo to what @hallway/docs needs ---
FROM base AS prepare
COPY . .
RUN pnpm dlx turbo@2.11.7 prune @hallway/docs --docker

# --- 2. Static export (out/) + Pagefind search index ---
FROM base AS builder
COPY --from=prepare /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=prepare /app/out/full/ .
RUN pnpm turbo run build --filter=@hallway/docs

# --- 3. Runtime: plain static file server ---
FROM caddy:2.11-alpine AS runner
COPY apps/docs/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/apps/docs/out /srv
EXPOSE 80
