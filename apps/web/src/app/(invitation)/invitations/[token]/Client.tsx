"use client";

import type { InvitationPreview } from "@hallway/shared";

import { AcceptCard } from "./_components/accept-card";
import { LinkProblemCard } from "./_components/link-problem-card";
import { SignUpCard } from "./_components/sign-up-card";
import { WrongAccountCard } from "./_components/wrong-account-card";
import { useController } from "./useController";

export type InvitationDetails = NonNullable<InvitationPreview["invitation"]>;

/** What the page shows; page.tsx decides from the invitation and the session. */
export type InvitationView =
  | { kind: "invalid" }
  | { kind: "expired" }
  | { kind: "signUp"; invitation: InvitationDetails }
  | { kind: "accept"; invitation: InvitationDetails }
  | {
      kind: "wrongAccount";
      invitation: InvitationDetails;
      /** E-mail of the signed-in account. */
      accountEmail: string;
    };

interface ClientProps {
  token: string;
  view: InvitationView;
}

export function Client({ token, view }: ClientProps) {
  const controller = useController(
    token,
    "invitation" in view ? view.invitation : undefined,
  );

  switch (view.kind) {
    case "invalid":
    case "expired":
      return <LinkProblemCard kind={view.kind} />;
    case "signUp":
      return (
        <SignUpCard
          token={token}
          invitation={view.invitation}
          errors={controller.errors}
          formError={controller.formError}
          accountExists={controller.accountExists}
          isPending={controller.isPending}
          onSubmit={controller.onSubmit}
        />
      );
    case "accept":
      return (
        <AcceptCard
          invitation={view.invitation}
          error={controller.accept.error}
          isPending={controller.accept.isPending}
          onAccept={controller.accept.run}
        />
      );
    case "wrongAccount":
      return (
        <WrongAccountCard
          invitationEmail={view.invitation.email}
          accountEmail={view.accountEmail}
          error={controller.switchAccount.error}
          isPending={controller.switchAccount.isPending}
          onSwitchAccount={controller.switchAccount.run}
        />
      );
  }
}
