"use client";

import { PASSWORD_MIN_LENGTH } from "@hallway/shared";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";

import { AuthCard } from "../_components/auth-card";
import { FormAlert } from "../_components/form-alert";
import { GithubButton } from "../_components/github-button";
import { TextField } from "../_components/text-field";
import { useController } from "./useController";

export function Client({ github: githubEnabled }: { github: boolean }) {
  const { errors, formError, isPending, onSubmit, github } = useController();

  return (
    <AuthCard
      title="Załóż konto"
      description="Po rejestracji wyślemy link potwierdzający na Twój e-mail."
      footer={
        <span>
          Masz już konto?{" "}
          <Link
            href="/login"
            className="text-foreground underline underline-offset-4"
          >
            Zaloguj się
          </Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="2xl:gap-6">
          {formError && <FormAlert>{formError}</FormAlert>}
          <TextField
            name="name"
            label="Imię i nazwisko"
            autoComplete="name"
            placeholder="Jan Kowalski"
            error={errors.name}
          />
          <TextField
            name="email"
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
            autoComplete="new-password"
            placeholder={`Co najmniej ${PASSWORD_MIN_LENGTH} znaków`}
            error={errors.password}
          />
          <Button
            type="submit"
            className="h-12 w-full text-base 2xl:h-14 2xl:text-lg"
            disabled={isPending}
          >
            {isPending ? "Zakładanie konta…" : "Załóż konto"}
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
    </AuthCard>
  );
}
