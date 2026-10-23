import type { Me } from "@hallway/shared";
import { ORPCError } from "@orpc/client";
import { cache } from "react";

import { serverClient } from "./orpc-server";

/**
 * The signed-in user with their communities and units, for server components; null
 * without a valid session. Cached per request.
 */
export const getMe = cache(async (): Promise<Me | null> => {
  try {
    return await serverClient.me.get();
  } catch (error) {
    if (error instanceof ORPCError && error.code === "UNAUTHORIZED")
      return null;
    throw error;
  }
});

// Pure helpers live apart, so client code can use them without the server client
export { belongsSomewhere, firstName } from "./me-utils";
