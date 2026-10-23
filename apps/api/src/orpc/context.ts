import type { Database } from "@hallway/db";
import { orpc } from "@hallway/shared";
import { implement } from "@orpc/server";
import type { FastifyBaseLogger } from "fastify";

import type { Auth } from "../auth/auth.js";
import type { Env } from "../config/env.js";
import type { Mailer } from "../mail/mailer.js";

/** Per-request context passed to every oRPC procedure. */
export interface ApiContext {
  db: Database;
  env: Env;
  log: FastifyBaseLogger;
  auth: Auth;
  mailer: Mailer;
  /** Headers of the incoming request; the session cookie is read from them. */
  headers: Headers;
}

/** Entry point for implementing procedures of the shared contract. */
export const os = implement(orpc).$context<ApiContext>();
