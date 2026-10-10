import type { Metadata } from "next";
import Link from "next/link";

import { firstParam } from "@/lib/search-params";

import { AuthCard } from "../_components/auth-card";
import { ResendVerification } from "../_components/resend-verification";

export const metadata: Metadata = { title: "Potwierdź e-mail – Hallway" };

export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/verify-email">) {
  const email = firstParam((await searchParams).email);

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
        <ResendVerification email={email} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Nie dostałeś wiadomości? Zaloguj się, a wyślemy link ponownie.
        </p>
      )}
    </AuthCard>
  );
}
