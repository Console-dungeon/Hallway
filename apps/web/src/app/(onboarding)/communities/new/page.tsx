import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { belongsSomewhere, getMe } from "@/lib/me";

import { Client } from "./Client";

export const metadata: Metadata = { title: "Nowa wspólnota – Hallway" };

export default async function NewCommunityPage() {
  const me = await getMe();
  if (!me) redirect("/login");

  // "Wstecz" on the first step leads to where the visitor came from
  return <Client exitHref={belongsSomewhere(me) ? "/" : "/welcome"} />;
}
