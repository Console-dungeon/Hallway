"use client";

import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { AuthError } from "@/lib/auth-errors";

import { FormAlert } from "./form-alert";

export function GithubButton() {
  const signIn = useMutation({
    mutationFn: async () => {
      // On success the browser leaves for github.com, so there is nothing to do afterwards
      const { error } = await authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
        errorCallbackURL: "/login",
      });
      if (error) throw new AuthError(error);
    },
  });

  return (
    <>
      {signIn.error && <FormAlert>{signIn.error.message}</FormAlert>}
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full text-base 2xl:h-14 2xl:text-lg"
        disabled={signIn.isPending}
        onClick={() => signIn.mutate()}
      >
        Kontynuuj przez GitHub
      </Button>
    </>
  );
}
