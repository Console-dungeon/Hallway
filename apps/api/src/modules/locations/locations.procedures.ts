import { os } from "../../orpc/context.js";
import { requireCommunity } from "../../orpc/middleware.js";
import * as service from "./locations.service.js";
import { LocationsError } from "./locations.service.js";

/** Runs a service call and turns its domain errors into the errors of the contract. */
async function answer<T>(
  errors: Record<LocationsError["code"], () => Error>,
  call: () => Promise<T>,
) {
  try {
    return await call();
  } catch (error) {
    if (error instanceof LocationsError) throw errors[error.code]();
    throw error;
  }
}

const manage = requireCommunity("locations.manage");

export const locations = {
  create: os.locations.create
    .use(manage)
    .handler(({ context, input, errors }) =>
      answer(errors, () =>
        service.createLocation(context.db, input.communityId, {
          name: input.name,
          buildingId: input.buildingId,
          staircaseId: input.staircaseId,
        }),
      ),
    ),
  update: os.locations.update
    .use(manage)
    .handler(({ context, input, errors }) =>
      answer(errors, () =>
        service.renameLocation(
          context.db,
          input.communityId,
          input.locationId,
          input.name,
        ),
      ),
    ),
  remove: os.locations.remove
    .use(manage)
    .handler(({ context, input, errors }) =>
      answer(errors, () =>
        service.deleteLocation(context.db, input.communityId, input.locationId),
      ),
    ),
};
