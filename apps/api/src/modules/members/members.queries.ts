import {
  and,
  asc,
  communityMembers,
  type DbOrTx,
  eq,
  unitMembers,
  users,
} from "@hallway/db";
import type { CommunityMemberRole, UnitMemberRole } from "@hallway/shared";

/** Admins, workers and contractors of the community, by name. */
export function listCommunityMembers(db: DbOrTx, communityId: string) {
  return db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      role: communityMembers.role,
      companyName: communityMembers.companyName,
    })
    .from(communityMembers)
    .innerJoin(users, eq(users.id, communityMembers.userId))
    .where(eq(communityMembers.communityId, communityId))
    .orderBy(asc(users.name), asc(users.email));
}

export async function findCommunityMember(
  db: DbOrTx,
  communityId: string,
  userId: string,
) {
  const [member] = await db
    .select({ id: communityMembers.id, role: communityMembers.role })
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId),
      ),
    );
  return member;
}

/**
 * The community's admins, locked until the transaction ends: two admins demoting each
 * other at once wait for one another instead of both succeeding.
 */
export async function lockAdmins(db: DbOrTx, communityId: string) {
  return db
    .select({ id: communityMembers.id })
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.role, "admin"),
      ),
    )
    .for("update");
}

export function updateCommunityMember(
  db: DbOrTx,
  memberId: string,
  values: { role: CommunityMemberRole; companyName: string | null },
) {
  return db
    .update(communityMembers)
    .set(values)
    .where(eq(communityMembers.id, memberId));
}

export function deleteCommunityMember(db: DbOrTx, memberId: string) {
  return db.delete(communityMembers).where(eq(communityMembers.id, memberId));
}

/** Owners and residents of the unit, by name. */
export function listUnitMembers(db: DbOrTx, unitId: string) {
  return db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      role: unitMembers.role,
    })
    .from(unitMembers)
    .innerJoin(users, eq(users.id, unitMembers.userId))
    .where(eq(unitMembers.unitId, unitId))
    .orderBy(asc(users.name), asc(users.email));
}

export async function findUnitMember(
  db: DbOrTx,
  unitId: string,
  userId: string,
) {
  const [member] = await db
    .select({ id: unitMembers.id })
    .from(unitMembers)
    .where(and(eq(unitMembers.unitId, unitId), eq(unitMembers.userId, userId)));
  return member;
}

export function updateUnitMember(
  db: DbOrTx,
  memberId: string,
  role: UnitMemberRole,
) {
  return db
    .update(unitMembers)
    .set({ role })
    .where(eq(unitMembers.id, memberId));
}

export function deleteUnitMember(db: DbOrTx, memberId: string) {
  return db.delete(unitMembers).where(eq(unitMembers.id, memberId));
}
