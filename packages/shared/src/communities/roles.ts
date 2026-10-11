import { z } from "zod";

/** Role of a person in a community as a whole. One person has at most one per community. */
export const communityMemberRoles = ["admin", "worker", "contractor"] as const;
export const communityMemberRoleSchema = z.enum(communityMemberRoles);
export type CommunityMemberRole = z.infer<typeof communityMemberRoleSchema>;

/** Role of a person in a single unit. Both have the same permissions (docs/permissions.md). */
export const unitMemberRoles = ["owner", "resident"] as const;
export const unitMemberRoleSchema = z.enum(unitMemberRoles);
export type UnitMemberRole = z.infer<typeof unitMemberRoleSchema>;

/** What an invitation can grant: a community role, or a unit role (then it names a unit). */
export const invitationRoles = [
  ...communityMemberRoles,
  ...unitMemberRoles,
] as const;
export const invitationRoleSchema = z.enum(invitationRoles);
export type InvitationRole = z.infer<typeof invitationRoleSchema>;

/** True for roles that are assigned to a unit instead of the whole community. */
export function isUnitRole(role: InvitationRole): role is UnitMemberRole {
  return (unitMemberRoles as readonly string[]).includes(role);
}

/** Polish names shown in the interface. */
export const invitationRoleLabels: Record<InvitationRole, string> = {
  admin: "Administrator",
  worker: "Pracownik",
  contractor: "Wykonawca",
  owner: "Właściciel",
  resident: "Mieszkaniec",
};
