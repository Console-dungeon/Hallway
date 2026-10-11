import { os } from "../../orpc/context.js";
import { requireAuth } from "../../orpc/middleware.js";
import { createCommunity } from "./communities.service.js";

// Founding needs no community role: any signed-in user may do it (docs/permissions.md)
export const create = os.communities.create
  .use(requireAuth)
  .handler(({ context, input }) =>
    createCommunity(context.db, context.user.id, input),
  );
