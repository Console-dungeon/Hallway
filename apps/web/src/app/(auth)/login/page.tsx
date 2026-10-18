import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { redirectErrorMessage } from "@/lib/auth-errors";
import { getAuthMethods } from "@/lib/auth-methods";
import { invitationPath, invitationTokenFrom } from "@/lib/invitation-links";
import { getInvitation } from "@/lib/invitations";
import { firstParam } from "@/lib/search-params";
import { getSession } from "@/lib/session";

import { Client } from "./Client";

export const metadata: Metadata = { title: "Logowanie – Hallway" };

/**
 * Sign-in on the way to an invitation (?invitation=<token>): the notice names the
 * community, the e-mail is filled in, and after signing in the invitation opens again.
 * A token that leads nowhere is ignored and the page works as usual.
 */
async function invitationFor(token: string | undefined) {
  if (!token) return undefined;
  const { state, invitation } = await getInvitation(token);
  if (state !== "valid" || !invitation) return undefined;
  return {
    token,
    email: invitation.email,
    communityName: invitation.communityName,
  };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const token = invitationTokenFrom(firstParam(params.invitation));
  // Signed in already: the invitation page says what the link is worth (also when expired)
  if (await getSession()) redirect(token ? invitationPath(token) : "/");

  const invitation = await invitationFor(token);
  const { github } = await getAuthMethods();

  return (
    <Client
      github={github}
      invitation={invitation}
      redirectError={redirectErrorMessage(params.error)}
      redirectNotice={
        firstParam(params.notice) === "password-reset"
          ? "Hasło zostało zmienione. Zaloguj się nowym hasłem."
          : undefined
      }
    />
  );
}
