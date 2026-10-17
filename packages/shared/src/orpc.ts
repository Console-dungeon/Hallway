import { authContract } from "./auth/contract.js";
import { communitiesContract } from "./communities/contract.js";
import { meContract } from "./me/contract.js";
import { structureContract } from "./structure/contract.js";
import { healthContract } from "./system/health.js";

/**
 * oRPC contract of the whole API: apps/api implements it, apps/web gets a typed client from it.
 * Every procedure declares its HTTP route, so the same contract also serves REST + OpenAPI.
 */
export const orpc = {
  auth: authContract,
  communities: communitiesContract,
  me: meContract,
  structure: structureContract,
  system: {
    health: healthContract,
  },
};

export type ORPC = typeof orpc;
