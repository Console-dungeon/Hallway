"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

import { FormCard } from "@/components/form-card";
import { FormAlert } from "@/components/form-alert";
import { TextField } from "@/components/text-field";
import { useController } from "./useController";

export function Client() {
  const { errors, formError, isPending, isSent, onSubmit } = useController();

  return (
    <FormCard
      title="Nie pamiętasz hasła?"
      description="Podaj e-mail konta, a wyślemy link do ustawienia nowego hasła."
      footer={
        <Link href="/login" className="underline underline-offset-4">
          Wróć do logowania
        </Link>
      }
    >
      {isSent ? (
        // Same answer whether or not the account exists, so the form can't be used to probe e-mails
        <FormAlert variant="default">
          Jeśli konto z tym adresem istnieje, wysłaliśmy na nie link do
          ustawienia nowego hasła. Sprawdź skrzynkę.
        </FormAlert>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup className="2xl:gap-6">
            {formError && <FormAlert>{formError}</FormAlert>}
            <TextField
              name="email"
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="jan@example.com"
              error={errors.email}
            />
            <Button
              type="submit"
              className="h-12 w-full text-base 2xl:h-14 2xl:text-lg"
              disabled={isPending}
            >
              {isPending ? "Wysyłanie…" : "Wyślij link"}
            </Button>
          </FieldGroup>
        </form>
      )}
    </FormCard>
  );
}
