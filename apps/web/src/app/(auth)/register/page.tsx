import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthMethods } from "@/lib/auth-methods";
import { getSession } from "@/lib/session";

import { AuthCard } from "../_components/auth-card";
import { RegisterForm } from "../_components/register-form";

export const metadata: Metadata = { title: "Rejestracja – Hallway" };

export default async function RegisterPage() {
  if (await getSession()) redirect("/");
  const { github } = await getAuthMethods();

  return (
    <AuthCard
      title="Załóż konto"
      description="Po rejestracji wyślemy link potwierdzający na Twój e-mail."
      footer={
        <span>
          Masz już konto?{" "}
          <Link
            href="/login"
            className="text-foreground underline underline-offset-4"
          >
            Zaloguj się
          </Link>
        </span>
      }
    >
      <RegisterForm github={github} />
    </AuthCard>
  );
}
