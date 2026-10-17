import { z } from "zod";

import {
  communityMemberRoleSchema,
  unitMemberRoleSchema,
} from "../communities/roles.js";
import { checkCompanyName, companyNameSchema } from "../invitations/schemas.js";

/** A person with a role in the community as a whole. */
export const communityMemberSchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  role: communityMemberRoleSchema,
  companyName: z.string().nullable().describe("Contractors only"),
});

/** A person assigned to one unit. */
export const unitMemberSchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  role: unitMemberRoleSchema,
});

/** Fields of a community role change; check them with `checkCompanyName`. */
export const communityMemberRoleShape = {
  role: communityMemberRoleSchema,
  companyName: companyNameSchema,
};

/** Changing someone's role in the community (the form). */
export const updateCommunityMemberSchema = z
  .object(communityMemberRoleShape)
  .superRefine(checkCompanyName);

/** Changing someone's role in a unit (the form). */
export const updateUnitMemberSchema = z.object({ role: unitMemberRoleSchema });

export const memberRefSchema = z.object({ userId: z.string() });

export type CommunityMember = z.infer<typeof communityMemberSchema>;
export type UnitMember = z.infer<typeof unitMemberSchema>;
export type UpdateCommunityMemberInput = z.infer<
  typeof updateCommunityMemberSchema
>;
export type UpdateUnitMemberInput = z.infer<typeof updateUnitMemberSchema>;
