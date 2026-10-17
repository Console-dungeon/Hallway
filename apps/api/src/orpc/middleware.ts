import {
  accessErrors,
  type CommunityAction,
  communityErrors,
} from "@hallway/shared";
import { ORPCError } from "@orpc/server";

import { loadCommunityAccess } from "../modules/communities/communities.service.js";
import { can } from "../policies/community.js";
import { type ApiContext, os } from "./context.js";

/** The session of the caller; a blocked account has none (Better Auth ends its sessions). */
async function requireSession(context: ApiContext) {
  const result = await context.auth.api.getSession({
    headers: context.headers,
  });
  if (!result) throw new ORPCError("UNAUTHORIZED", accessErrors.UNAUTHORIZED);
  return result;
}

/**
 * Lets only signed-in users through and adds `user` and `session` to the context.
 * The procedure's contract must start from `protectedContract`.
 */
export const requireAuth = os.middleware(async ({ context, next }) => {
  const { user, session } = await requireSession(context);
  return next({ context: { user, session } });
});

/**
 * For procedures with `communityId` in their input: lets through only signed-in users
 * who may perform `action` in that community (docs/permissions.md) and adds `user`,
 * `session` and `access` to the context. An unknown or removed community is a 404.
 * The procedure's contract must start from `communityContract`.
 */
export function requireCommunity(action: CommunityAction) {
  return os.middleware(
    async ({ context, next }, input: { communityId: string }) => {
      const { user, session } = await requireSession(context);
      const access = await loadCommunityAccess(
        context.db,
        input.communityId,
        user,
      );
      if (!access) throw new ORPCError("NOT_FOUND", communityErrors.NOT_FOUND);
      if (!can(access, action)) {
        throw new ORPCError("FORBIDDEN", accessErrors.FORBIDDEN);
      }
      return next({ context: { user, session, access } });
    },
  );
}
