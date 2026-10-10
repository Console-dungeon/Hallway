"use client";

import {
  PASSWORD_MIN_LENGTH,
  type SignUpInput,
  signUpSchema,
} from "@hallway/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { AuthError } from "@/lib/auth-errors";
import { type FieldErrors, parseForm } from "@/lib/form";

import { FormAlert } from "./form-alert";
import { GithubButton } from "./github-button";
import { TextField } from "./text-field";

export function RegisterForm({ github }: { github: boolean }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors<SignUpInput>>({});

  const signUp = useMutation({
    mutationFn: async (input: SignUpInput) => {
      // callbackURL: where the link from the verification e-mail lands
      const { error } = await authClient.signUp.email({
        ...input,
        callbackURL: "/",
      });
      if (error) throw new AuthError(error);
    },
    onSuccess: (_data, input) => {
      router.push(`/verify-email?email=${encodeURIComponent(input.email)}`);
    },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, errors } = parseForm(signUpSchema, event.currentTarget);
    setErrors(errors ?? {});
    if (data) signUp.mutate(data);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="2xl:gap-6">
        {signUp.error && <FormAlert>{signUp.error.message}</FormAlert>}
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
          disabled={signUp.isPending}
        >
          {signUp.isPending ? "Zakładanie konta…" : "Załóż konto"}
        </Button>
        {github && (
          <>
            <FieldSeparator className="2xl:text-base">albo</FieldSeparator>
            <GithubButton />
          </>
        )}
      </FieldGroup>
    </form>
  );
}
