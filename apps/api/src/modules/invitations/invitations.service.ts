import { createHash, randomBytes } from "node:crypto";

import type { Database, DbOrTx } from "@hallway/db";
import {
  type CommunityMemberRole,
  INVITATION_VALID_DAYS,
  type InvitationCreated,
  type InvitationPreview,
  type InvitationRole,
  type InvitationSignUpInput,
  isUnitRole,
  type UnitMemberRole,
} from "@hallway/shared";

import type { Auth } from "../../auth/auth.js";
import type { Mailer } from "../../mail/mailer.js";
import {
  findActiveCommunity,
  findMemberRole,
} from "../communities/communities.queries.js";
import { invitationEmail } from "./email-templates/invitation.js";
import * as queries from "./invitations.queries.js";
import type { InvitationRow } from "./invitations.queries.js";

/** What can go wrong with an invitation; procedures turn it into contract errors. */
export class InvitationError extends Error {
  constructor(
    readonly code:
      | "NOT_FOUND"
      | "MAIL_FAILED"
      | "INVITATION_INVALID"
      | "INVITATION_EXPIRED"
      | "EMAIL_MISMATCH"
      | "ACCOUNT_EXISTS",
    options?: ErrorOptions,
  ) {
    super(code, options);
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The link carries the token; the database only its hash, so a leaked table opens nothing. */
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// --- Sending ---

interface SendDeps {
  db: Database;
  mailer: Mailer;
  /** Public origin of the web app; the link points at its /invitations/<token> page. */
  appUrl: string;
}

interface Inviter {
  id: string;
  name: string;
}

interface NewInvitation {
  communityId: string;
  communityName: string;
  email: string;
  role: InvitationRole;
  unit: {
    id: string;
    number: string;
    staircaseName: string;
    buildingName: string;
  } | null;
  companyName: string | null;
}

/**
 * Stores the invitation and e-mails the link, in one transaction: when the e-mail cannot
 * be sent, the invitation is not kept.
 */
function send(
  deps: SendDeps,
  inviter: Inviter,
  invitation: NewInvitation,
): Promise<InvitationCreated> {
  const token = randomBytes(32).toString("base64url");
  return deps.db.transaction(async (tx) => {
    const created = await queries.insertInvitation(tx, {
      communityId: invitation.communityId,
      email: invitation.email,
      role: invitation.role,
      unitId: invitation.unit?.id ?? null,
      companyName: invitation.companyName,
      tokenHash: hashToken(token),
      invitedBy: inviter.id,
      expiresAt: new Date(Date.now() + INVITATION_VALID_DAYS * DAY_MS),
    });
    try {
      await deps.mailer.send({
        to: invitation.email,
        ...invitationEmail({
          ...invitation,
          invitedByName: inviter.name,
          url: `${deps.appUrl}/invitations/${token}`,
        }),
      });
    } catch (error) {
      throw new InvitationError("MAIL_FAILED", { cause: error });
    }
    return { id: created.id, email: invitation.email };
  });
}

async function communityOf(db: Database, communityId: string) {
  const community = await findActiveCommunity(db, communityId);
  if (!community) throw new InvitationError("NOT_FOUND");
  return community;
}

/**
 * Invites someone to the community as admin, worker or contractor. Someone who already has
 * a role there is invited as usual; accepting then changes nothing.
 */
export async function inviteToCommunity(
  deps: SendDeps,
  communityId: string,
  inviter: Inviter,
  input: {
    email: string;
    role: CommunityMemberRole;
    companyName?: string | undefined;
  },
) {
  const community = await communityOf(deps.db, communityId);
  return send(deps, inviter, {
    communityId,
    communityName: community.name,
    email: input.email,
    role: input.role,
    unit: null,
    companyName: input.role === "contractor" ? input.companyName || null : null,
  });
}

/**
 * Invites someone to one unit of the community as owner or resident. Someone already in
 * the unit is invited as usual; accepting then changes nothing.
 */
export async function inviteToUnit(
  deps: SendDeps,
  communityId: string,
  unitId: string,
  inviter: Inviter,
  input: { email: string; role: UnitMemberRole },
) {
  const [community, unit] = await Promise.all([
    communityOf(deps.db, communityId),
    queries.findUnitPlace(deps.db, communityId, unitId),
  ]);
  if (!unit) throw new InvitationError("NOT_FOUND");
  return send(deps, inviter, {
    communityId,
    communityName: community.name,
    email: input.email,
    role: input.role,
    unit,
    companyName: null,
  });
}

// --- Using the link ---

/** A known invitation that was not revoked and whose community still exists. */
function usable(invitation: InvitationRow | undefined) {
  return invitation && !invitation.revokedAt && !invitation.communityArchivedAt
    ? invitation
    : undefined;
}

function isExpired(invitation: InvitationRow) {
  return invitation.expiresAt.getTime() <= Date.now();
}

/**
 * Whether the user already holds what the invitation grants: a role in the community for
 * admin, worker and contractor invitations, a place in the unit for owner and resident
 * ones. Then accepting changes nothing.
 */
async function holdsGrant(
  db: DbOrTx,
  invitation: InvitationRow,
  userId: string,
) {
  if (invitation.unitId) {
    return queries.isUnitMember(db, invitation.unitId, userId);
  }
  return (await findMemberRole(db, invitation.communityId, userId)) !== null;
}

/** What the invitation page shows; an unusable token gives no details. */
export async function previewInvitation(
  db: Database,
  token: string,
): Promise<InvitationPreview> {
  const invalid: InvitationPreview = {
    state: "invalid",
    alreadyMember: false,
    accountExists: false,
    invitation: null,
  };
  const invitation = usable(
    await queries.findInvitationByTokenHash(db, hashToken(token)),
  );
  if (!invitation) return invalid;

  const userId = await queries.findUserIdByEmail(db, invitation.email);
  const alreadyMember = userId
    ? await holdsGrant(db, invitation, userId)
    : false;
  // Accepted and still a member: the link just leads there. Accepted and removed since: used up.
  if (invitation.acceptedAt && !alreadyMember) return invalid;

  const { unitNumber, staircaseName, buildingName } = invitation;
  return {
    state:
      invitation.acceptedAt || !isExpired(invitation) ? "valid" : "expired",
    alreadyMember,
    accountExists: userId !== undefined,
    invitation: {
      email: invitation.email,
      role: invitation.role,
      communityId: invitation.communityId,
      communityName: invitation.communityName,
      unit:
        unitNumber !== null && staircaseName !== null && buildingName !== null
          ? { number: unitNumber, staircaseName, buildingName }
          : null,
      invitedByName: invitation.invitedByName,
      companyName: invitation.companyName,
    },
  };
}

/** Gives the user what the invitation grants and marks it accepted. */
async function grant(db: DbOrTx, invitation: InvitationRow, userId: string) {
  const { role } = invitation;
  if (isUnitRole(role)) {
    if (!invitation.unitId) throw new Error("Unit invitation without a unit");
    await queries.insertUnitMemberIfAbsent(db, {
      unitId: invitation.unitId,
      userId,
      role,
    });
  } else {
    await queries.insertCommunityMemberIfAbsent(db, {
      communityId: invitation.communityId,
      userId,
      role,
      companyName: invitation.companyName,
    });
  }
  await queries.markAccepted(db, invitation.id, userId);
}

function acceptByHash(
  db: Database,
  tokenHash: string,
  user: { id: string; email: string },
) {
  return db.transaction(async (tx) => {
    // Locked, so two tabs accepting at once cannot both use it
    const invitation = usable(
      await queries.lockInvitationByTokenHash(tx, tokenHash),
    );
    if (!invitation) throw new InvitationError("INVITATION_INVALID");
    if (user.email.toLowerCase() !== invitation.email) {
      throw new InvitationError("EMAIL_MISMATCH");
    }
    const result = { communityId: invitation.communityId };
    if (await holdsGrant(tx, invitation, user.id)) return result;
    if (invitation.acceptedAt) throw new InvitationError("INVITATION_INVALID");
    if (isExpired(invitation)) throw new InvitationError("INVITATION_EXPIRED");

    await grant(tx, invitation, user.id);
    return result;
  });
}

/**
 * Accepts the invitation with the signed-in account, which must have the invitation
 * e-mail. Someone who already holds what it grants gets a success and no change.
 */
export function acceptInvitation(
  db: Database,
  token: string,
  user: { id: string; email: string },
) {
  return acceptByHash(db, hashToken(token), user);
}

/**
 * Creates an account for the invitation e-mail and accepts the invitation. The token
 * proves the address, so the account is verified right away and no verification e-mail
 * goes out. If accepting fails, the new account is removed again.
 */
export async function registerFromInvitation(
  deps: { db: Database; auth: Auth },
  token: string,
  input: InvitationSignUpInput,
) {
  const tokenHash = hashToken(token);
  const invitation = usable(
    await queries.findInvitationByTokenHash(deps.db, tokenHash),
  );
  if (!invitation || invitation.acceptedAt) {
    throw new InvitationError("INVITATION_INVALID");
  }
  if (isExpired(invitation)) throw new InvitationError("INVITATION_EXPIRED");
  if (await queries.findUserIdByEmail(deps.db, invitation.email)) {
    throw new InvitationError("ACCOUNT_EXISTS");
  }

  const { email } = invitation;
  const userId = await createVerifiedAccount(deps, { ...input, email });
  try {
    return await acceptByHash(deps.db, tokenHash, { id: userId, email });
  } catch (error) {
    await queries.deleteUser(deps.db, userId);
    throw error;
  }
}

/**
 * Better Auth's server-side createUser (admin plugin; called without a session it needs
 * no admin) hashes the password, adds the credential account and sends no e-mail.
 */
async function createVerifiedAccount(
  deps: { db: Database; auth: Auth },
  account: { email: string; name: string; password: string },
) {
  try {
    const { user } = await deps.auth.api.createUser({
      body: { ...account, data: { emailVerified: true } },
    });
    return user.id;
  } catch (error) {
    // Someone signed up with this e-mail in the meantime
    if (await queries.findUserIdByEmail(deps.db, account.email)) {
      throw new InvitationError("ACCOUNT_EXISTS");
    }
    throw error;
  }
}
