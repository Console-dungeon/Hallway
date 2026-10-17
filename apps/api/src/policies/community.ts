import {
  type CommunityAction,
  communityActions,
  type CommunityMemberRole,
  type UnitAction,
} from "@hallway/shared";

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
 * One rule per row of section 3.2 in docs/permissions.md; the action names live in
 * @hallway/shared, so a new action does not compile until it has a rule here. Founding
 * a community is not here: it needs no community yet, only a signed-in user.
 */
const rules: Record<CommunityAction, Rule> = {
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
};

/** Whether someone with this access may perform the action in their community. */
export function can(access: CommunityAccess, action: CommunityAction): boolean {
  return rules[action](access);
}

/** Everything this access allows; sent to the web app so it can hide what would be refused. */
export function allowedActions(access: CommunityAccess): CommunityAction[] {
  return communityActions.filter((action) => can(access, action));
}

type UnitRule = (access: CommunityAccess, unitId: string) => boolean;

/**
 * Rules that depend on one unit, not only on the community: the people assigned to a unit
 * see each other, the community's staff does not. The unit id must already be known to
 * belong to the community (`requireUnit` checks it).
 */
const unitRules: Record<UnitAction, UnitRule> = {
  "unitMembers.list": (access, unitId) =>
    can(access, "members.list") || access.unitIds.includes(unitId),
};

/** Whether someone with this access may perform the action on this unit of their community. */
export function canInUnit(
  access: CommunityAccess,
  action: UnitAction,
  unitId: string,
): boolean {
  return unitRules[action](access, unitId);
}
