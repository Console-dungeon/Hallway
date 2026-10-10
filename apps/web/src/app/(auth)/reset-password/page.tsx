import type { Metadata } from "next";
import Link from "next/link";

import { firstParam } from "@/lib/search-params";

import { AuthCard } from "../_components/auth-card";
import { FormAlert } from "../_components/form-alert";
import { ResetPasswordForm } from "../_components/reset-password-form";

export const metadata: Metadata = { title: "Nowe hasło – Hallway" };

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const params = await searchParams;
  const token = firstParam(params.token);
  // Better Auth redirects here with ?error=INVALID_TOKEN when the link is used up or expired
  const invalid = !token || firstParam(params.error) !== undefined;

  return (
    <AuthCard
      title="Ustaw nowe hasło"
      footer={
        <Link
          href={invalid ? "/forgot-password" : "/login"}
          className="underline underline-offset-4"
        >
          {invalid ? "Wyślij nowy link" : "Wróć do logowania"}
        </Link>
      }
    >
      {invalid ? (
        <FormAlert>
          Link do zmiany hasła jest nieprawidłowy lub wygasł.
        </FormAlert>
      ) : (
        <ResetPasswordForm token={token} />
      )}
    </AuthCard>
  );
}
