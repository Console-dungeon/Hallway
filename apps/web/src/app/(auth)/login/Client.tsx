"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";

import { FormCard } from "@/components/form-card";
import { FormAlert } from "@/components/form-alert";
import { GithubButton } from "../_components/github-button";
import { TextField } from "@/components/text-field";
import { useController } from "./useController";

/** Sign-in on the way to accepting an invitation. */
export interface LoginInvitation {
  token: string;
  /** The address the invitation was sent to; filled in, but can be changed. */
  email: string;
  communityName: string;
}

interface ClientProps {
  /** Whether GitHub sign-in is configured in the API. */
  github: boolean;
  invitation?: LoginInvitation | undefined;
  redirectError?: string | undefined;
  redirectNotice?: string | undefined;
}

export function Client({
  github: githubEnabled,
  invitation,
  redirectError,
  redirectNotice,
}: ClientProps) {
  const { errors, formError, isPending, onSubmit, github } = useController({
    invitationToken: invitation?.token,
    redirectError,
    redirectNotice,
  });

  return (
    <FormCard
      title="Zaloguj się"
      description="Podaj e-mail i hasło do swojego konta."
      footer={
        <span>
          Nie masz konta?{" "}
          <Link
            href="/register"
            className="text-foreground underline underline-offset-4"
          >
            Załóż konto
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="2xl:gap-6">
          {invitation && (
            <FormAlert variant="default">
              Zaloguj się, aby przyjąć zaproszenie do wspólnoty{" "}
              {invitation.communityName}.
            </FormAlert>
          )}
          {formError && <FormAlert>{formError}</FormAlert>}
          <TextField
            name="email"
            defaultValue={invitation?.email}
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="jan@example.com"
            error={errors.email}
          />
          <TextField
            name="password"
            label="Hasło"
            type="password"
            autoComplete="current-password"
            error={errors.password}
            labelAction={
              <Link
                href="/forgot-password"
                className="text-base text-muted-foreground underline-offset-4 hover:underline 2xl:text-lg"
              >
                Nie pamiętasz hasła?
              </Link>
            }
          />
          <Button
            type="submit"
            className="h-12 w-full text-base 2xl:h-14 2xl:text-lg"
            disabled={isPending}
          >
            {isPending ? "Logowanie…" : "Zaloguj się"}
          </Button>
          {githubEnabled && (
            <>
              <FieldSeparator className="2xl:text-base">albo</FieldSeparator>
              <GithubButton
                onClick={github.signIn}
                isPending={github.isPending}
                error={github.error}
              />
            </>
          )}
        </FieldGroup>
      </form>
    </FormCard>
  );
}
