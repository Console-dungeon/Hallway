import type { CommunityDetail } from "@hallway/shared";
import { ORPCError } from "@orpc/client";

import { serverClient } from "./orpc-server";

/**
 * A community with its structure, for server components; null when it does not exist or
 * the visitor may not see it (both look the same to them).
 */
export async function getCommunity(
  communityId: string,
): Promise<CommunityDetail | null> {
  try {
    return await serverClient.communities.get({ communityId });
  } catch (error) {
    if (
      error instanceof ORPCError &&
      (error.code === "NOT_FOUND" || error.code === "FORBIDDEN")
    ) {
      return null;
    }
    throw error;
  }
}
