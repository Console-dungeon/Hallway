import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "../_components/auth-card";
import { ForgotPasswordForm } from "../_components/forgot-password-form";

export const metadata: Metadata = { title: "Reset hasła – Hallway" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Nie pamiętasz hasła?"
      description="Podaj e-mail konta, a wyślemy link do ustawienia nowego hasła."
      footer={
        <Link href="/login" className="underline underline-offset-4">
          Wróć do logowania
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
