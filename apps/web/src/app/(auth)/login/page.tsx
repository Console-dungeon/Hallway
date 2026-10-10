import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { redirectErrorMessage } from "@/lib/auth-errors";
import { getAuthMethods } from "@/lib/auth-methods";
import { firstParam } from "@/lib/search-params";
import { getSession } from "@/lib/session";

import { Client } from "./Client";

export const metadata: Metadata = { title: "Logowanie – Hallway" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSession()) redirect("/");

  const params = await searchParams;
  const { github } = await getAuthMethods();

  return (
    <Client
      github={github}
      redirectError={redirectErrorMessage(params.error)}
      redirectNotice={
        firstParam(params.notice) === "password-reset"
          ? "Hasło zostało zmienione. Zaloguj się nowym hasłem."
          : undefined
      }
    />
  );
}
