import type { Database, DbOrTx } from "@hallway/db";
import type {
  UnitMemberRole,
  UpdateCommunityMemberInput,
} from "@hallway/shared";

import { findUnit } from "../structure/structure.queries.js";
import * as queries from "./members.queries.js";

/** What can go wrong with members of a community; procedures turn it into contract errors. */
export class MembersError extends Error {
  constructor(readonly code: "NOT_FOUND" | "LAST_ADMIN") {
    super(code);
  }
}

export function listMembers(db: Database, communityId: string) {
  return queries.listCommunityMembers(db, communityId);
}

/**
 * The person's role in the community, read after the admins are locked, so the
 * at-least-one-admin rule holds also when two admins act at the same time.
 */
async function memberWithAdmins(
  tx: DbOrTx,
  communityId: string,
  userId: string,
) {
  const admins = await queries.lockAdmins(tx, communityId);
  const member = await queries.findCommunityMember(tx, communityId, userId);
  if (!member) throw new MembersError("NOT_FOUND");
  const isLastAdmin = member.role === "admin" && admins.length <= 1;
  return { member, isLastAdmin };
}

/** Changes someone's community role; the last admin cannot stop being one. */
export function updateMember(
  db: Database,
  communityId: string,
  userId: string,
  input: UpdateCommunityMemberInput,
) {
  return db.transaction(async (tx) => {
    const { member, isLastAdmin } = await memberWithAdmins(
      tx,
      communityId,
      userId,
    );
    if (isLastAdmin && input.role !== "admin") {
      throw new MembersError("LAST_ADMIN");
    }
    await queries.updateCommunityMember(tx, member.id, {
      role: input.role,
      companyName:
        input.role === "contractor" ? input.companyName || null : null,
    });
    return { userId };
  });
}

/** Takes away someone's community role; their unit assignments stay. Not the last admin. */
export function removeMember(
  db: Database,
  communityId: string,
  userId: string,
) {
  return db.transaction(async (tx) => {
    const { member, isLastAdmin } = await memberWithAdmins(
      tx,
      communityId,
      userId,
    );
    if (isLastAdmin) throw new MembersError("LAST_ADMIN");
    await queries.deleteCommunityMember(tx, member.id);
    return { userId };
  });
}

async function unitOf(db: Database, communityId: string, unitId: string) {
  const unit = await findUnit(db, communityId, unitId);
  if (!unit) throw new MembersError("NOT_FOUND");
  return unit;
}

async function unitMemberOf(
  db: Database,
  communityId: string,
  unitId: string,
  userId: string,
) {
  const unit = await unitOf(db, communityId, unitId);
  const member = await queries.findUnitMember(db, unit.id, userId);
  if (!member) throw new MembersError("NOT_FOUND");
  return member;
}

export async function listUnitMembers(
  db: Database,
  communityId: string,
  unitId: string,
) {
  const unit = await unitOf(db, communityId, unitId);
  return queries.listUnitMembers(db, unit.id);
}

export async function updateUnitMember(
  db: Database,
  communityId: string,
  unitId: string,
  userId: string,
  role: UnitMemberRole,
) {
  const member = await unitMemberOf(db, communityId, unitId, userId);
  await queries.updateUnitMember(db, member.id, role);
  return { userId };
}

export async function removeUnitMember(
  db: Database,
  communityId: string,
  unitId: string,
  userId: string,
) {
  const member = await unitMemberOf(db, communityId, unitId, userId);
  await queries.deleteUnitMember(db, member.id);
  return { userId };
}
