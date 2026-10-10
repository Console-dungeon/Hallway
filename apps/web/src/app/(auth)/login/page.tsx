import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { redirectErrorMessage } from "@/lib/auth-errors";
import { getAuthMethods } from "@/lib/auth-methods";
import { firstParam } from "@/lib/search-params";
import { getSession } from "@/lib/session";

import { AuthCard } from "../_components/auth-card";
import { LoginForm } from "../_components/login-form";
import { RedirectToast } from "../_components/redirect-toast";

export const metadata: Metadata = { title: "Logowanie – Hallway" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSession()) redirect("/");

  const params = await searchParams;
  const error = redirectErrorMessage(params.error);
  const notice = firstParam(params.notice);
  const { github } = await getAuthMethods();

  return (
    <AuthCard
      title="Zaloguj się"
      description="Podaj e-mail i hasło do swojego konta."
      footer={
        <span>
          Nie masz konta?{" "}
          <Link
            href="/register"
            className="text-foreground underline underline-offset-4"
          >
            Załóż konto
          </Link>
        </span>
      }
    >
      {error && <RedirectToast message={error} variant="error" />}
      {notice === "password-reset" && (
        <RedirectToast
          message="Hasło zostało zmienione. Zaloguj się nowym hasłem."
          variant="success"
        />
      )}
      <LoginForm github={github} />
    </AuthCard>
  );
}
