"use client";

import { type SignInInput, signInSchema } from "@hallway/shared";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
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

export function LoginForm({ github }: { github: boolean }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors<SignInInput>>({});

  const signIn = useMutation({
    mutationFn: async (input: SignInInput) => {
      const { error } = await authClient.signIn.email(input);
      if (error) throw new AuthError(error);
    },
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
    onError: (error, input) => {
      // The API has just sent a fresh verification link to this address
      if (error instanceof AuthError && error.code === "EMAIL_NOT_VERIFIED") {
        router.push(`/verify-email?email=${encodeURIComponent(input.email)}`);
      }
    },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, errors } = parseForm(signInSchema, event.currentTarget);
    setErrors(errors ?? {});
    if (data) signIn.mutate(data);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="2xl:gap-6">
        {signIn.error && <FormAlert>{signIn.error.message}</FormAlert>}
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
          disabled={signIn.isPending}
        >
          {signIn.isPending ? "Logowanie…" : "Zaloguj się"}
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
