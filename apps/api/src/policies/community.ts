import type { CommunityMemberRole } from "@hallway/shared";

/** What a user is in one community; loaded per request, then passed to `can`. */
export interface CommunityAccess {
  /** Platform operator: may read any community, never change it. */
  isSuperadmin: boolean;
  /** Role in the community as a whole, if any. */
  memberRole: CommunityMemberRole | null;
  /** Units of this community the user owns or lives in. */
  unitIds: readonly string[];
}

type Rule = (access: CommunityAccess) => boolean;

const isAdmin: Rule = (access) => access.memberRole === "admin";
const hasUnit: Rule = (access) => access.unitIds.length > 0;

/**
 * One rule per row of section 3.2 in docs/permissions.md. Founding a community is not
 * here: it needs no community yet, only a signed-in user.
 */
const rules = {
  "community.update": isAdmin,
  "community.delete": isAdmin,
  "structure.manage": isAdmin,
  "locations.manage": isAdmin,
  "unitMembers.invite": isAdmin,
  "communityMembers.invite": isAdmin,
  "members.manage": isAdmin,
  "members.list": (access) => access.isSuperadmin || isAdmin(access),
  "structure.view": (access) =>
    access.isSuperadmin ||
    isAdmin(access) ||
    access.memberRole === "worker" ||
    hasUnit(access),
  "units.viewOwn": hasUnit,
} satisfies Record<string, Rule>;

export type CommunityAction = keyof typeof rules;

export const communityActions = Object.keys(rules) as CommunityAction[];

/** Whether someone with this access may perform the action in their community. */
export function can(access: CommunityAccess, action: CommunityAction): boolean {
  return rules[action](access);
}
