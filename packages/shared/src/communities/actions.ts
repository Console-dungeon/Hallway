import { z } from "zod";

/**
 * What can be done inside a community; one name per row of section 3.2 in
 * docs/permissions.md. Who may do what is decided in apps/api/src/policies/community.ts.
 */
export const communityActions = [
  "community.update",
  "community.delete",
  "structure.manage",
  "locations.manage",
  "unitMembers.invite",
  "communityMembers.invite",
  "members.manage",
  "members.list",
  "structure.view",
  "units.viewOwn",
] as const;
export const communityActionSchema = z.enum(communityActions);
export type CommunityAction = z.infer<typeof communityActionSchema>;

/**
 * What can be done with one unit of a community, where the answer depends on the unit:
 * the people assigned to a unit see each other. Rules in apps/api/src/policies/community.ts.
 */
export const unitActions = ["unitMembers.list"] as const;
export const unitActionSchema = z.enum(unitActions);
export type UnitAction = z.infer<typeof unitActionSchema>;
