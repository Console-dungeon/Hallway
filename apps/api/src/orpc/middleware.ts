import {
  accessErrors,
  type CommunityAction,
  communityErrors,
  type UnitAction,
} from "@hallway/shared";
import { ORPCError } from "@orpc/server";

import { loadCommunityAccess } from "../modules/communities/communities.service.js";
import { findUnit } from "../modules/structure/structure.queries.js";
import { can, canInUnit } from "../policies/community.js";
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
      const { user, session, access } = await requireAccess(
        context,
        input.communityId,
      );
      if (!can(access, action)) {
        throw new ORPCError("FORBIDDEN", accessErrors.FORBIDDEN);
      }
      return next({ context: { user, session, access } });
    },
  );
}

/**
 * Like `requireCommunity`, for procedures about one unit (`communityId` and `unitId` in
 * their input) whose rule depends on the unit, e.g. people of a unit see each other.
 * A unit that is not in the community is a 404.
 */
export function requireUnit(action: UnitAction) {
  return os.middleware(
    async (
      { context, next },
      input: { communityId: string; unitId: string },
    ) => {
      const { user, session, access } = await requireAccess(
        context,
        input.communityId,
      );
      if (!(await findUnit(context.db, input.communityId, input.unitId))) {
        throw new ORPCError("NOT_FOUND", communityErrors.NOT_FOUND);
      }
      if (!canInUnit(access, action, input.unitId)) {
        throw new ORPCError("FORBIDDEN", accessErrors.FORBIDDEN);
      }
      return next({ context: { user, session, access } });
    },
  );
}

/** The session and what the caller is in the community; an unknown or removed one is a 404. */
async function requireAccess(context: ApiContext, communityId: string) {
  const { user, session } = await requireSession(context);
  const access = await loadCommunityAccess(context.db, communityId, user);
  if (!access) throw new ORPCError("NOT_FOUND", communityErrors.NOT_FOUND);
  return { user, session, access };
}
