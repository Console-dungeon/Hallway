import { createDb, type Database } from "@hallway/db";
import Fastify from "fastify";

import { type Auth, createAuth } from "./auth.js";
import { authPlugin } from "./auth-plugin.js";
import type { Env } from "./env.js";
import { createSmtpMailer, type Mailer } from "./mailer.js";
import { orpcPlugin } from "./orpc-plugin.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
    auth: Auth;
    mailer: Mailer;
  }
}

// All routes live under /api, so Caddy can route <domain>/api/* (and dev.<domain>/api/*) here
export const API_PREFIX = "/api";

export async function buildApp(env: Env) {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL },
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
  await app.register(orpcPlugin, { prefix: API_PREFIX });

  return app;
}
