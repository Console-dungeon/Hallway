"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

import { AuthCard } from "../_components/auth-card";
import { FormAlert } from "../_components/form-alert";
import { useController } from "./useController";

export function Client({ email }: { email?: string | undefined }) {
  const { resendError, isResending, isResent, resend } = useController(email);

  return (
    <AuthCard
      title="Sprawdź skrzynkę"
      description={
        email ? (
          <>
            Wysłaliśmy link potwierdzający na adres{" "}
            <span className="font-medium text-foreground">{email}</span>.
            Kliknij go, aby aktywować konto.
          </>
        ) : (
          "Wysłaliśmy link potwierdzający na Twój adres e-mail. Kliknij go, aby aktywować konto."
        )
      }
      footer={
        <Link href="/login" className="underline underline-offset-4">
          Wróć do logowania
        </Link>
      }
    >
      {email ? (
        <div className="flex flex-col gap-3">
          {resendError && <FormAlert>{resendError}</FormAlert>}
          {isResent && (
            <FormAlert variant="default">Wysłaliśmy nowy link.</FormAlert>
          )}
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full text-base 2xl:h-14 2xl:text-lg"
            disabled={isResending}
            onClick={resend}
          >
            {isResending ? "Wysyłanie…" : "Wyślij link ponownie"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nie dostałeś wiadomości? Zaloguj się, a wyślemy link ponownie.
        </p>
      )}
    </AuthCard>
  );
}
