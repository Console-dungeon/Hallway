"use client";

import { PASSWORD_MIN_LENGTH } from "@hallway/shared";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

import { AuthCard } from "../_components/auth-card";
import { FormAlert } from "../_components/form-alert";
import { TextField } from "../_components/text-field";
import { useController } from "./useController";

interface ClientProps {
  /** Missing when the link was opened without a token or Better Auth rejected it. */
  token?: string | undefined;
}

export function Client({ token }: ClientProps) {
  const { errors, formError, isPending, onSubmit } = useController(token);

  return (
    <AuthCard
      title="Ustaw nowe hasło"
      footer={
        <Link
          href={token ? "/login" : "/forgot-password"}
          className="underline underline-offset-4"
        >
          {token ? "Wróć do logowania" : "Wyślij nowy link"}
        </Link>
      }
    >
      {token ? (
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup className="2xl:gap-6">
            {formError && <FormAlert>{formError}</FormAlert>}
            <TextField
              name="password"
              label="Nowe hasło"
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
              {isPending ? "Zapisywanie…" : "Ustaw nowe hasło"}
            </Button>
          </FieldGroup>
        </form>
      ) : (
        <FormAlert>
          Link do zmiany hasła jest nieprawidłowy lub wygasł.
        </FormAlert>
      )}
    </AuthCard>
  );
}
