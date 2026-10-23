import { createDb, type Database } from "@hallway/db";
import Fastify from "fastify";

import { type Auth, createAuth } from "./auth/auth.js";
import { authPlugin } from "./auth/plugin.js";
import type { Env } from "./config/env.js";
import { createSmtpMailer, type Mailer } from "./mail/mailer.js";
import { orpcPlugin } from "./orpc/plugin.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
    auth: Auth;
    mailer: Mailer;
  }
}

// All routes live under /api, so Caddy can route <domain>/api/* (and dev.<domain>/api/*) here
export const API_PREFIX = "/api";

/**
 * `/api/invitations/<token>[/…]` → `/api/invitations/<redacted>[/…]`: the token in an
 * invitation link is a credential. RPC paths (`/api/rpc/invitations/get`) carry it in the
 * body, so they stay as they are.
 */
function redactInvitationToken(url: string) {
  return url.replace(/(?<!\/rpc)(\/invitations\/)[^/?#]+/, "$1<redacted>");
}

export async function buildApp(env: Env) {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      serializers: {
        // Fastify's default request fields, with invitation tokens kept out of the logs
        req: (request) => ({
          method: request.method,
          url: redactInvitationToken(request.url),
          version: request.headers["accept-version"]?.toString(),
          host: request.host,
          remoteAddress: request.ip,
          remotePort: request.socket?.remotePort,
        }),
      },
    },
  });

  const { db, pool } = createDb(env.DATABASE_URL, {
    onPoolError: (error) => app.log.error(error, "Postgres pool error"),
  });
  app.decorate("db", db);
  app.addHook("onClose", async () => {
    await pool.end();
  });

  const mailer = createSmtpMailer(env);
  const auth = createAuth({ db, env, mailer, log: app.log });
  app.decorate("mailer", mailer);
  app.decorate("auth", auth);

  await app.register(authPlugin, {
    prefix: API_PREFIX,
    auth,
    baseURL: env.BETTER_AUTH_URL,
  });
  await app.register(orpcPlugin, { prefix: API_PREFIX, env });

  return app;
}
