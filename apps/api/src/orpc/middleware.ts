import { accessErrors } from "@hallway/shared";
import { ORPCError } from "@orpc/server";

import { os } from "./context.js";

/**
 * Lets only signed-in users through and adds `user` and `session` to the context.
 * A blocked account has no session (Better Auth ends its sessions), so it gets 401 too.
 * The procedure's contract must start from `protectedContract`.
 */
export const requireAuth = os.middleware(async ({ context, next }) => {
  const result = await context.auth.api.getSession({
    headers: context.headers,
  });
  if (!result) throw new ORPCError("UNAUTHORIZED", accessErrors.UNAUTHORIZED);

  return next({ context: { user: result.user, session: result.session } });
});
