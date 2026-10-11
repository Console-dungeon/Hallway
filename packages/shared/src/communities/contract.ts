import { protectedContract } from "../errors.js";
import { communitySummarySchema, createCommunitySchema } from "./schemas.js";

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
};
