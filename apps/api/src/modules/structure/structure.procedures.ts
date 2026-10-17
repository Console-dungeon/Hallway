import { os } from "../../orpc/context.js";
import { requireCommunity } from "../../orpc/middleware.js";
import * as service from "./structure.service.js";
import { StructureError } from "./structure.service.js";

/** Runs a service call and turns its domain errors into the errors of the contract. */
async function answer<T>(
  errors: Record<StructureError["code"], () => Error>,
  call: () => Promise<T>,
) {
  try {
    return await call();
  } catch (error) {
    if (error instanceof StructureError) throw errors[error.code]();
    throw error;
  }
}

const manage = requireCommunity("structure.manage");

export const buildings = {
  create: os.structure.buildings.create
    .use(manage)
    .handler(({ context, input, errors }) =>
      answer(errors, () =>
        service.createBuilding(context.db, input.communityId, input),
      ),
    ),
  update: os.structure.buildings.update
    .use(manage)
    .handler(({ context, input, errors }) =>
      answer(errors, () =>
        service.renameBuilding(
          context.db,
          input.communityId,
          input.buildingId,
          input.name,
        ),
      ),
    ),
  remove: os.structure.buildings.remove
    .use(manage)
    .handler(({ context, input, errors }) =>
      answer(errors, () =>
        service.deleteBuilding(context.db, input.communityId, input.buildingId),
      ),
    ),
};

export const staircases = {
  create: os.structure.staircases.create
    .use(manage)
    .handler(({ context, input, errors }) =>
      answer(errors, () =>
        service.createStaircase(
          context.db,
          input.communityId,
          input.buildingId,
          input.name,
        ),
      ),
    ),
  update: os.structure.staircases.update
    .use(manage)
    .handler(({ context, input, errors }) =>
      answer(errors, () =>
        service.renameStaircase(
          context.db,
          input.communityId,
          input.staircaseId,
          input.name,
        ),
      ),
    ),
  remove: os.structure.staircases.remove
    .use(manage)
    .handler(({ context, input, errors }) =>
      answer(errors, () =>
        service.deleteStaircase(
          context.db,
          input.communityId,
          input.staircaseId,
        ),
      ),
    ),
};

export const units = {
  create: os.structure.units.create
    .use(manage)
    .handler(({ context, input, errors }) =>
      answer(errors, () =>
        service.createUnit(context.db, input.communityId, input.staircaseId, {
          number: input.number,
          floor: input.floor,
        }),
      ),
    ),
  createSeries: os.structure.units.createSeries
    .use(manage)
    .handler(({ context, input, errors }) =>
      answer(errors, () =>
        service.createUnitSeries(
          context.db,
          input.communityId,
          input.staircaseId,
          { from: input.from, to: input.to },
        ),
      ),
    ),
  update: os.structure.units.update
    .use(manage)
    .handler(({ context, input, errors }) =>
      answer(errors, () =>
        service.updateUnit(context.db, input.communityId, input.unitId, {
          number: input.number,
          floor: input.floor,
        }),
      ),
    ),
  remove: os.structure.units.remove
    .use(manage)
    .handler(({ context, input, errors }) =>
      answer(errors, () =>
        service.deleteUnit(context.db, input.communityId, input.unitId),
      ),
    ),
};
