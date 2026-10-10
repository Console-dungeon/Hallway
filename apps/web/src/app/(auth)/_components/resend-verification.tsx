"use client";

import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { AuthError } from "@/lib/auth-errors";

import { FormAlert } from "./form-alert";

export function ResendVerification({ email }: { email: string }) {
  const resend = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/",
      });
      if (error) throw new AuthError(error);
    },
  });

  return (
    <div className="flex flex-col gap-3">
      {resend.error && <FormAlert>{resend.error.message}</FormAlert>}
      {resend.isSuccess && (
        <FormAlert variant="default">Wysłaliśmy nowy link.</FormAlert>
      )}
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full"
        disabled={resend.isPending}
        onClick={() => resend.mutate()}
      >
        {resend.isPending ? "Wysyłanie…" : "Wyślij link ponownie"}
      </Button>
    </div>
  );
}
