import { os } from "../../orpc/context.js";
import { requireAuth, requireCommunity } from "../../orpc/middleware.js";
import {
  createCommunity,
  getCommunityDetail,
  removeCommunity,
  updateCommunityDetails,
} from "./communities.service.js";

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

export const update = os.communities.update
  .use(requireCommunity("community.update"))
  .handler(async ({ context, input, errors }) => {
    const community = await updateCommunityDetails(
      context.db,
      input.communityId,
      { name: input.name, address: input.address },
    );
    if (!community) throw errors.NOT_FOUND();
    return community;
  });

// The UI asks for the community's name before removing it; the API needs no confirmation
export const remove = os.communities.remove
  .use(requireCommunity("community.delete"))
  .handler(async ({ context, input, errors }) => {
    const community = await removeCommunity(context.db, input.communityId);
    if (!community) throw errors.NOT_FOUND();
    return community;
  });
