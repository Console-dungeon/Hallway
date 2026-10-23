import { z } from "zod";

import { communityContract, protectedContract } from "../errors.js";
import {
  communityDataSchema,
  communityDetailSchema,
  communityDetailsSchema,
  communitySummarySchema,
  createCommunitySchema,
} from "./schemas.js";

export const communitiesContract = {
  create: protectedContract
    .route({
      method: "POST",
      path: "/communities",
      successStatus: 201,
      tags: ["communities"],
      summary: "Found a community; the caller becomes its admin",
    })
    .input(createCommunitySchema)
    .output(communitySummarySchema),
  get: communityContract
    .route({
      method: "GET",
      path: "/communities/{communityId}",
      tags: ["communities"],
      summary:
        "A community with its buildings, staircases, units and common areas",
    })
    .input(z.object({ communityId: z.string() }))
    .output(communityDetailSchema),
  update: communityContract
    .route({
      method: "PATCH",
      path: "/communities/{communityId}",
      tags: ["communities"],
      summary: "Change the name and address of a community",
    })
    .input(communityDetailsSchema.extend({ communityId: z.string() }))
    .output(communityDataSchema),
  remove: communityContract
    .route({
      method: "DELETE",
      path: "/communities/{communityId}",
      tags: ["communities"],
      summary:
        "Remove a community: it is hidden from everyone, its data stays in the database",
    })
    .input(z.object({ communityId: z.string() }))
    .output(communitySummarySchema.pick({ id: true })),
};
