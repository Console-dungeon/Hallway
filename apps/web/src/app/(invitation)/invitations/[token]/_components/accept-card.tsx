import { MailOpen } from "lucide-react";

import { FormAlert } from "@/components/form-alert";
import { FormCard } from "@/components/form-card";
import { Button } from "@/components/ui/button";

import type { InvitationDetails } from "../Client";
import { invitationDetails, invitedTo } from "./invitation-text";

interface AcceptCardProps {
  invitation: InvitationDetails;
  error?: string | undefined;
  isPending: boolean;
  onAccept: () => void;
}

/** Signed in with the invited address: what the invitation grants and one button. */
export function AcceptCard({
  invitation,
  error,
  isPending,
  onAccept,
}: AcceptCardProps) {
  const rows = [
    { label: "Wspólnota", value: invitation.communityName },
    ...invitationDetails(invitation),
  ];

  return (
    <FormCard
      icon={MailOpen}
      title="Zaproszenie do wspólnoty"
      description={`${invitedTo(invitation, "wspólnoty w Hallway")}.`}
    >
      <div className="flex flex-col gap-6">
        <dl className="flex flex-col gap-2.5 rounded-lg border bg-muted/40 px-4 py-3.5 text-sm 2xl:text-base">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex gap-3">
              <dt className="w-24 shrink-0 text-muted-foreground 2xl:w-28">
                {label}
              </dt>
              <dd className="min-w-0 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        {error && <FormAlert>{error}</FormAlert>}
        <Button
          type="button"
          className="h-12 w-full text-base 2xl:h-14 2xl:text-lg"
          disabled={isPending}
          onClick={onAccept}
        >
          {isPending ? "Dołączanie…" : "Dołącz do wspólnoty"}
        </Button>
        <p className="text-sm text-muted-foreground 2xl:text-base">
          Zaproszenie wysłano na adres {invitation.email}.
        </p>
      </div>
    </FormCard>
  );
}
