import {
  and,
  buildings,
  communities,
  communityMembers,
  type DbOrTx,
  eq,
  invitations,
  staircases,
  unitMembers,
  units,
  users,
} from "@hallway/db";
import type {
  CommunityMemberRole,
  InvitationRole,
  UnitMemberRole,
} from "@hallway/shared";

export async function insertInvitation(
  db: DbOrTx,
  values: {
    communityId: string;
    email: string;
    role: InvitationRole;
    unitId: string | null;
    companyName: string | null;
    tokenHash: string;
    invitedBy: string;
    expiresAt: Date;
  },
) {
  const [invitation] = await db
    .insert(invitations)
    .values(values)
    .returning({ id: invitations.id });
  if (!invitation) throw new Error("Insert into invitations returned no row");
  return invitation;
}

/** An invitation with everything its page shows: community, unit, who sent it. */
function selectInvitation(db: DbOrTx) {
  return db
    .select({
      id: invitations.id,
      communityId: invitations.communityId,
      email: invitations.email,
      role: invitations.role,
      unitId: invitations.unitId,
      companyName: invitations.companyName,
      expiresAt: invitations.expiresAt,
      acceptedAt: invitations.acceptedAt,
      revokedAt: invitations.revokedAt,
      communityName: communities.name,
      communityArchivedAt: communities.archivedAt,
      invitedByName: users.name,
      unitNumber: units.number,
      staircaseName: staircases.name,
      buildingName: buildings.name,
    })
    .from(invitations)
    .innerJoin(communities, eq(communities.id, invitations.communityId))
    .leftJoin(users, eq(users.id, invitations.invitedBy))
    .leftJoin(units, eq(units.id, invitations.unitId))
    .leftJoin(staircases, eq(staircases.id, units.staircaseId))
    .leftJoin(buildings, eq(buildings.id, staircases.buildingId));
}

export type InvitationRow = NonNullable<
  Awaited<ReturnType<typeof findInvitationByTokenHash>>
>;

export async function findInvitationByTokenHash(db: DbOrTx, tokenHash: string) {
  const [invitation] = await selectInvitation(db).where(
    eq(invitations.tokenHash, tokenHash),
  );
  return invitation;
}

/** Same as `findInvitationByTokenHash`, locking the invitation until the transaction ends. */
export async function lockInvitationByTokenHash(db: DbOrTx, tokenHash: string) {
  const [invitation] = await selectInvitation(db)
    .where(eq(invitations.tokenHash, tokenHash))
    .for("update", { of: invitations });
  return invitation;
}

/** A unit of the community with where it is, for the invitation e-mail. */
export async function findUnitPlace(
  db: DbOrTx,
  communityId: string,
  unitId: string,
) {
  const [unit] = await db
    .select({
      id: units.id,
      number: units.number,
      staircaseName: staircases.name,
      buildingName: buildings.name,
    })
    .from(units)
    .innerJoin(staircases, eq(staircases.id, units.staircaseId))
    .innerJoin(buildings, eq(buildings.id, staircases.buildingId))
    .where(and(eq(units.id, unitId), eq(buildings.communityId, communityId)));
  return unit;
}

/** E-mails are stored in lower case, by Better Auth and by us. */
export async function findUserIdByEmail(db: DbOrTx, email: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));
  return user?.id;
}

export async function isUnitMember(db: DbOrTx, unitId: string, userId: string) {
  const [member] = await db
    .select({ id: unitMembers.id })
    .from(unitMembers)
    .where(and(eq(unitMembers.unitId, unitId), eq(unitMembers.userId, userId)));
  return member !== undefined;
}

/** Gives the community role unless the person already has one there. */
export async function insertCommunityMemberIfAbsent(
  db: DbOrTx,
  values: {
    communityId: string;
    userId: string;
    role: CommunityMemberRole;
    companyName: string | null;
  },
) {
  await db
    .insert(communityMembers)
    .values(values)
    .onConflictDoNothing({
      target: [communityMembers.communityId, communityMembers.userId],
    });
}

/** Assigns the person to the unit unless they already are. */
export async function insertUnitMemberIfAbsent(
  db: DbOrTx,
  values: { unitId: string; userId: string; role: UnitMemberRole },
) {
  await db
    .insert(unitMembers)
    .values(values)
    .onConflictDoNothing({ target: [unitMembers.unitId, unitMembers.userId] });
}

export function markAccepted(db: DbOrTx, invitationId: string, userId: string) {
  return db
    .update(invitations)
    .set({ acceptedAt: new Date(), acceptedBy: userId })
    .where(eq(invitations.id, invitationId));
}

/** Undoes an account created moments ago; its sessions and sign-in methods go with it. */
export function deleteUser(db: DbOrTx, userId: string) {
  return db.delete(users).where(eq(users.id, userId));
}
