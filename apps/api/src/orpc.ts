import type { Database } from "@hallway/db";
import { contract } from "@hallway/shared";
import { implement } from "@orpc/server";
import type { FastifyBaseLogger } from "fastify";

/** Per-request context passed to every oRPC procedure. */
export interface ApiContext {
  db: Database;
  log: FastifyBaseLogger;
}

/** Entry point for implementing procedures of the shared contract. */
export const os = implement(contract).$context<ApiContext>();
