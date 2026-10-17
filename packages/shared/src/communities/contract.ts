import { z } from "zod";

import { communityContract, protectedContract } from "../errors.js";
import {
  communityDetailSchema,
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
      summary: "A community with its buildings, staircases and units",
    })
    .input(z.object({ communityId: z.string() }))
    .output(communityDetailSchema),
};
