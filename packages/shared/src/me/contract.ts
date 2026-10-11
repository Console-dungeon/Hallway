import { z } from "zod";

import { userRoleSchema } from "../auth/roles.js";
import {
  communityMemberRoleSchema,
  unitMemberRoleSchema,
} from "../communities/roles.js";
import { protectedContract } from "../errors.js";

export const meSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
    role: userRoleSchema,
  }),
  communities: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        role: communityMemberRoleSchema,
      }),
    )
    .describe("Communities the user belongs to as admin, worker or contractor"),
  units: z
    .array(
      z.object({
        id: z.string(),
        number: z.string(),
        role: unitMemberRoleSchema,
        staircaseName: z.string(),
        buildingName: z.string(),
        communityId: z.string(),
        communityName: z.string(),
      }),
    )
    .describe("Units the user owns or lives in, across all communities"),
});

export type Me = z.infer<typeof meSchema>;

export const meContract = {
  get: protectedContract
    .route({
      method: "GET",
      path: "/me",
      tags: ["me"],
      summary: "The signed-in user with their communities and units",
    })
    .output(meSchema),
};
