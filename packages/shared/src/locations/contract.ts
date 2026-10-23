import { z } from "zod";

import { communityContract } from "../errors.js";
import { createdSchema } from "../structure/schemas.js";
import {
  checkLocationLevel,
  locationLevelShape,
  locationSchema,
} from "./schemas.js";

const tags = ["locations"];

// Path parameters; every route starts with the community, which is what permissions hang on
const inCommunity = { communityId: z.string() };
const location = { ...inCommunity, locationId: z.string() };

/** Common areas of a community, a building or a staircase; listed by `communities.get`. */
export const locationsContract = {
  create: communityContract
    .route({
      method: "POST",
      path: "/communities/{communityId}/locations",
      successStatus: 201,
      tags,
      summary:
        "Add a common area to the community, a building (buildingId) or a staircase (buildingId and staircaseId)",
    })
    .input(
      locationSchema
        .extend({ ...inCommunity, ...locationLevelShape })
        .superRefine(checkLocationLevel),
    )
    .output(createdSchema),
  update: communityContract
    .route({
      method: "PATCH",
      path: "/communities/{communityId}/locations/{locationId}",
      tags,
      summary: "Rename a common area",
    })
    .input(locationSchema.extend(location))
    .output(createdSchema),
  remove: communityContract
    .route({
      method: "DELETE",
      path: "/communities/{communityId}/locations/{locationId}",
      tags,
      summary: "Delete a common area",
    })
    .input(z.object(location))
    .output(createdSchema),
};
