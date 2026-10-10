"use client";

import {
  PASSWORD_MIN_LENGTH,
  type ResetPasswordInput,
  resetPasswordSchema,
} from "@hallway/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { AuthError } from "@/lib/auth-errors";
import { type FieldErrors, parseForm } from "@/lib/form";

import { FormAlert } from "./form-alert";
import { TextField } from "./text-field";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors<ResetPasswordInput>>({});

  const reset = useMutation({
    mutationFn: async ({ password }: ResetPasswordInput) => {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (error) throw new AuthError(error);
    },
    onSuccess: () => router.push("/login?notice=password-reset"),
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, errors } = parseForm(
      resetPasswordSchema,
      event.currentTarget,
    );
    setErrors(errors ?? {});
    if (data) reset.mutate(data);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="2xl:gap-6">
        {reset.error && <FormAlert>{reset.error.message}</FormAlert>}
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
          disabled={reset.isPending}
        >
          {reset.isPending ? "Zapisywanie…" : "Ustaw nowe hasło"}
        </Button>
      </FieldGroup>
    </form>
  );
}
