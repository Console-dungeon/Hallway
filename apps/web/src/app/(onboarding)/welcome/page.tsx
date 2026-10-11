import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { belongsSomewhere, firstName, getMe } from "@/lib/me";

import { Client } from "./Client";

export const metadata: Metadata = { title: "Pierwsze kroki – Hallway" };

export default async function WelcomePage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (belongsSomewhere(me)) redirect("/");

  return <Client firstName={firstName(me)} />;
}
