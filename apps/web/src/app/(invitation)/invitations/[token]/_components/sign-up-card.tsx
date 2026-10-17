import {
  type InvitationSignUpInput,
  PASSWORD_MIN_LENGTH,
} from "@hallway/shared";
import { Lock } from "lucide-react";
import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { FormCard } from "@/components/form-card";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { FieldErrors } from "@/lib/form";
import { invitationLoginPath } from "@/lib/invitation-links";

import type { InvitationDetails } from "../Client";
import { invitationDetails, invitedTo } from "./invitation-text";

interface SignUpCardProps {
  token: string;
  invitation: InvitationDetails;
  errors: FieldErrors<InvitationSignUpInput>;
  formError?: string | undefined;
  /** The form error says the account exists; a sign-in link goes with it. */
  accountExists: boolean;
  isPending: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

/** Signed out and no account yet: sign up with the invited address and join at once. */
export function SignUpCard({
  token,
  invitation,
  errors,
  formError,
  accountExists,
  isPending,
  onSubmit,
}: SignUpCardProps) {
  const loginPath = invitationLoginPath(token);

  return (
    <FormCard
      title="Załóż konto, aby dołączyć"
      description={`${invitedTo(invitation, "Hallway")}. Po założeniu konta od razu trafisz do wspólnoty.`}
      footer={
        <span>
          Masz już konto?{" "}
          <Link
            href={loginPath}
            className="text-foreground underline underline-offset-4"
          >
            Zaloguj się
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="2xl:gap-6">
          <div className="rounded-lg border bg-muted/40 px-3.5 py-3">
            <p className="text-base font-medium 2xl:text-lg">
              {invitation.communityName}
            </p>
            <p className="text-sm text-muted-foreground 2xl:text-base">
              {invitationDetails(invitation)
                .map(({ value }) => value)
                .join(" · ")}
            </p>
          </div>
          {formError && (
            <FormAlert>
              {formError}
              {accountExists && (
                <>
                  {" "}
                  <Link href={loginPath}>Zaloguj się</Link>
                </>
              )}
            </FormAlert>
          )}
          <TextField
            name="name"
            label="Imię i nazwisko"
            autoComplete="name"
            placeholder="Jan Kowalski"
            error={errors.name}
          />
          {/* Shown only: the address comes from the invitation and is never sent */}
          <Field>
            <FieldLabel htmlFor="email" className="text-base 2xl:text-lg">
              E-mail
            </FieldLabel>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={invitation.email}
                readOnly
                aria-describedby="email-description"
                className="h-12 bg-muted/40 px-3.5 pr-11 text-base text-muted-foreground md:text-base 2xl:h-14 2xl:px-4 2xl:text-lg"
              />
              <Lock className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground 2xl:size-5" />
            </div>
            <FieldDescription id="email-description" className="2xl:text-base">
              Adres z zaproszenia – nie można go zmienić.
            </FieldDescription>
          </Field>
          <TextField
            name="password"
            label="Hasło"
            type="password"
            autoComplete="new-password"
            placeholder={`Co najmniej ${PASSWORD_MIN_LENGTH} znaków`}
            error={errors.password}
          />
          <Button
            type="submit"
            className="h-12 w-full text-base 2xl:h-14 2xl:text-lg"
            disabled={isPending}
          >
            {isPending ? "Zakładanie konta…" : "Załóż konto i dołącz"}
          </Button>
        </FieldGroup>
      </form>
    </FormCard>
  );
}
