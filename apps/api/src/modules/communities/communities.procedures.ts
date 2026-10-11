import { os } from "../../orpc/context.js";
import { requireAuth, requireCommunity } from "../../orpc/middleware.js";
import { createCommunity, getCommunityDetail } from "./communities.service.js";

// Founding needs no community role: any signed-in user may do it (docs/permissions.md)
export const create = os.communities.create
  .use(requireAuth)
  .handler(({ context, input }) =>
    createCommunity(context.db, context.user.id, input),
  );

export const get = os.communities.get
  .use(requireCommunity("structure.view"))
  .handler(async ({ context, input, errors }) => {
    const community = await getCommunityDetail(
      context.db,
      input.communityId,
      context.access,
    );
    if (!community) throw errors.NOT_FOUND();
    return community;
  });
