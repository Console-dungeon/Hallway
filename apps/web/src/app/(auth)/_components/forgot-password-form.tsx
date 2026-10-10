"use client";

import {
  type ForgotPasswordInput,
  forgotPasswordSchema,
} from "@hallway/shared";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { AuthError } from "@/lib/auth-errors";
import { type FieldErrors, parseForm } from "@/lib/form";

import { FormAlert } from "./form-alert";
import { TextField } from "./text-field";

export function ForgotPasswordForm() {
  const [errors, setErrors] = useState<FieldErrors<ForgotPasswordInput>>({});

  const request = useMutation({
    mutationFn: async ({ email }: ForgotPasswordInput) => {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      if (error) throw new AuthError(error);
    },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, errors } = parseForm(
      forgotPasswordSchema,
      event.currentTarget,
    );
    setErrors(errors ?? {});
    if (data) request.mutate(data);
  }

  if (request.isSuccess) {
    return (
      // Same answer whether or not the account exists, so the form can't be used to probe e-mails
      <FormAlert variant="default">
        Jeśli konto z tym adresem istnieje, wysłaliśmy na nie link do ustawienia
        nowego hasła. Sprawdź skrzynkę.
      </FormAlert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="2xl:gap-6">
        {request.error && <FormAlert>{request.error.message}</FormAlert>}
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
          disabled={request.isPending}
        >
          {request.isPending ? "Wysyłanie…" : "Wyślij link"}
        </Button>
      </FieldGroup>
    </form>
  );
}
