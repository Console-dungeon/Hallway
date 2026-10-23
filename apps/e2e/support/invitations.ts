import { createDb, eq, invitations } from "@hallway/db";
import type { APIRequestContext } from "@playwright/test";

import type { InvitationLink, Mailpit } from "./mailpit";

type CommunityRole = "admin" | "worker" | "contractor";
type UnitRole = "owner" | "resident";

interface Community {
  id: string;
  name: string;
}

/** Where an invitation leads: the community as a whole, or one of its units. */
type Invitation =
  | { email: string; role: CommunityRole; companyName?: string }
  | { email: string; role: UnitRole; unitId: string };

/**
 * Sends an invitation through the API as whoever `admin` is signed in as, and returns
 * its link from the e-mail. For tests where sending it is not what is being tested.
 */
export async function invite(
  admin: APIRequestContext,
  mailpit: Mailpit,
  community: Community,
  invitation: Invitation,
): Promise<InvitationLink> {
  const path =
    "unitId" in invitation
      ? `/api/communities/${community.id}/units/${invitation.unitId}/invitations`
      : `/api/communities/${community.id}/invitations`;
  const { email, role } = invitation;
  const response = await admin.post(path, {
    data: {
      email,
      role,
      ...("companyName" in invitation && {
        companyName: invitation.companyName,
      }),
    },
  });
  if (response.status() !== 201) {
    throw new Error(`Sending an invitation failed: ${response.status()}`);
  }
  return mailpit.invitationFrom({ to: email, communityName: community.name });
}

/** Accepts an invitation through the API as whoever `request` is signed in as. */
export async function acceptInvitation(
  request: APIRequestContext,
  { token }: Pick<InvitationLink, "token">,
) {
  const response = await request.post(`/api/invitations/${token}/accept`);
  if (!response.ok()) {
    throw new Error(`Accepting an invitation failed: ${response.status()}`);
  }
}

/**
 * Invites `member` and accepts as them: the quickest way to give an account a role in a
 * community or a place in a unit. Returns the member's user id.
 */
export async function addMember(
  admin: APIRequestContext,
  member: { request: APIRequestContext; email: string },
  mailpit: Mailpit,
  community: Community,
  invitation:
    | { role: CommunityRole; companyName?: string }
    | { role: UnitRole; unitId: string },
): Promise<string> {
  const link = await invite(admin, mailpit, community, {
    ...invitation,
    email: member.email,
  } as Invitation);
  await acceptInvitation(member.request, link);
  const me = (await (await member.request.get("/api/me")).json()) as {
    user: { id: string };
  };
  return me.user.id;
}

/**
 * Moves the expiry of every invitation sent to `email` into the past, as if the link were
 * older than 7 days. Written straight to the database: there is no endpoint for it.
 */
export async function expireInvitations(email: string) {
  const { db, pool } = createDb(process.env.DATABASE_URL ?? "");
  try {
    await db
      .update(invitations)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(invitations.email, email));
  } finally {
    await pool.end();
  }
}
