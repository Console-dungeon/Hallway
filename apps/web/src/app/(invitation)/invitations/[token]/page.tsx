import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { invitationLoginPath } from "@/lib/invitation-links";
import { getInvitation } from "@/lib/invitations";
import { getMe } from "@/lib/me";

import { Client, type InvitationView } from "./Client";

export const metadata: Metadata = { title: "Zaproszenie – Hallway" };

/**
 * The page an invitation e-mail links to; it works signed in and signed out. What it shows
 * depends on the invitation and on who opens it.
 */
export default async function InvitationPage({
  params,
}: PageProps<"/invitations/[token]">) {
  const { token } = await params;
  const [preview, me] = await Promise.all([getInvitation(token), getMe()]);

  // The invited account already has what the link grants: nothing to accept
  if (preview.alreadyMember) redirect(me ? "/" : "/login");

  const { state, invitation } = preview;
  let view: InvitationView;
  if (state === "invalid" || !invitation) {
    view = { kind: "invalid" };
  } else if (state === "expired") {
    view = { kind: "expired" };
  } else if (!me) {
    // An existing account signs in first and comes back here
    if (preview.accountExists) redirect(invitationLoginPath(token));
    view = { kind: "signUp", invitation };
  } else if (me.user.email.toLowerCase() === invitation.email.toLowerCase()) {
    view = { kind: "accept", invitation };
  } else {
    view = { kind: "wrongAccount", invitation, accountEmail: me.user.email };
  }

  return <Client token={token} view={view} />;
}
