import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAuthMethods } from "@/lib/auth-methods";
import { getSession } from "@/lib/session";

import { Client } from "./Client";

export const metadata: Metadata = { title: "Rejestracja – Hallway" };

export default async function RegisterPage() {
  if (await getSession()) redirect("/");
  const { github } = await getAuthMethods();

  return <Client github={github} />;
}
