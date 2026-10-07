# Build from the repo root:  docker build -f apps/api/Dockerfile .
FROM node:24-slim AS base
ENV HUSKY=0 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    TURBO_TELEMETRY_DISABLED=1
# pnpm comes from corepack, version pinned by devEngines.packageManager
RUN corepack enable
WORKDIR /app

# --- 1. Prune the monorepo to what @hallway/api needs (better layer caching) ---
FROM base AS prepare
COPY . .
RUN pnpm dlx turbo@2.11.7 prune @hallway/api --docker

# --- 2. Install, build and create a production-only copy ---
FROM base AS builder
COPY --from=prepare /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=prepare /app/out/full/ .
RUN pnpm turbo run build --filter=@hallway/api
# Self-contained folder: dist/ + production node_modules (incl. @hallway/db migrations)
RUN pnpm --filter @hallway/api deploy --prod /prod/api

# --- 3. Small runtime image ---
FROM node:24-slim AS runner
ENV NODE_ENV=production \
    API_HOST=0.0.0.0 \
    API_PORT=3001
WORKDIR /app
COPY --from=builder --chown=node:node /prod/api ./
USER node
EXPOSE 3001
# Migrations run separately before start: `node dist/migrate.js`
CMD ["node", "dist/server.js"]
