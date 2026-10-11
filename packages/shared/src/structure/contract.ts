import { z } from "zod";

import { communityContract } from "../errors.js";
import {
  buildingNameFormSchema,
  buildingSchema,
  checkUnitSeries,
  createdSchema,
  staircaseSchema,
  unitSchema,
  unitSeriesResultSchema,
  unitSeriesShape,
} from "./schemas.js";

const tags = ["structure"];

// Path parameters; every route starts with the community, which is what permissions hang on
const inCommunity = { communityId: z.string() };
const building = { ...inCommunity, buildingId: z.string() };
const staircase = { ...inCommunity, staircaseId: z.string() };
const unit = { ...inCommunity, unitId: z.string() };

export const structureContract = {
  buildings: {
    create: communityContract
      .route({
        method: "POST",
        path: "/communities/{communityId}/buildings",
        successStatus: 201,
        tags,
        summary: "Add a building, optionally with its staircases",
      })
      .input(buildingSchema.extend(inCommunity))
      .output(createdSchema),
    update: communityContract
      .route({
        method: "PATCH",
        path: "/communities/{communityId}/buildings/{buildingId}",
        tags,
        summary: "Rename a building",
      })
      .input(buildingNameFormSchema.extend(building))
      .output(createdSchema),
    remove: communityContract
      .route({
        method: "DELETE",
        path: "/communities/{communityId}/buildings/{buildingId}",
        tags,
        summary: "Delete a building with its staircases and units",
      })
      .input(z.object(building))
      .output(createdSchema),
  },
  staircases: {
    create: communityContract
      .route({
        method: "POST",
        path: "/communities/{communityId}/buildings/{buildingId}/staircases",
        successStatus: 201,
        tags,
        summary: "Add a staircase to a building",
      })
      .input(staircaseSchema.extend(building))
      .output(createdSchema),
    update: communityContract
      .route({
        method: "PATCH",
        path: "/communities/{communityId}/staircases/{staircaseId}",
        tags,
        summary: "Rename a staircase",
      })
      .input(staircaseSchema.extend(staircase))
      .output(createdSchema),
    remove: communityContract
      .route({
        method: "DELETE",
        path: "/communities/{communityId}/staircases/{staircaseId}",
        tags,
        summary: "Delete a staircase with its units",
      })
      .input(z.object(staircase))
      .output(createdSchema),
  },
  units: {
    create: communityContract
      .route({
        method: "POST",
        path: "/communities/{communityId}/staircases/{staircaseId}/units",
        successStatus: 201,
        tags,
        summary: "Add one unit to a staircase",
      })
      .input(unitSchema.extend(staircase))
      .output(createdSchema),
    createSeries: communityContract
      .route({
        method: "POST",
        path: "/communities/{communityId}/staircases/{staircaseId}/units/series",
        successStatus: 201,
        tags,
        summary: "Add units numbered from…to; numbers that exist are skipped",
      })
      .input(
        z
          .object({ ...staircase, ...unitSeriesShape })
          .superRefine(checkUnitSeries),
      )
      .output(unitSeriesResultSchema),
    update: communityContract
      .route({
        method: "PATCH",
        path: "/communities/{communityId}/units/{unitId}",
        tags,
        summary: "Change a unit's number or floor",
      })
      .input(unitSchema.extend(unit))
      .output(createdSchema),
    remove: communityContract
      .route({
        method: "DELETE",
        path: "/communities/{communityId}/units/{unitId}",
        tags,
        summary: "Delete a unit that has no people assigned",
      })
      .input(z.object(unit))
      .output(createdSchema),
  },
};
