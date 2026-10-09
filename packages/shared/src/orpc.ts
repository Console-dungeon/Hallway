import { healthContract } from "./health.js";

/**
 * oRPC contract of the whole API: apps/api implements it, apps/web gets a typed client from it.
 * Every procedure declares its HTTP route, so the same contract also serves REST + OpenAPI.
 */
export const orpc = {
  system: {
    health: healthContract,
  },
};

export type ORPC = typeof orpc;
