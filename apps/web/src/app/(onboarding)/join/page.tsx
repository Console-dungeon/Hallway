import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getMe } from "@/lib/me";

import { Client } from "./Client";

export const metadata: Metadata = { title: "Dołącz do wspólnoty – Hallway" };

/** Origin the visitor sees (behind the proxy too), for the example link in the hints. */
async function publicOrigin() {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");
  const protocol = list.get("x-forwarded-proto") ?? "http";
  return host ? `${protocol}://${host}` : "";
}

export default async function JoinPage() {
  const me = await getMe();
  if (!me) redirect("/login");

  return (
    <Client
      email={me.user.email}
      invitationsUrl={`${await publicOrigin()}/invitations/`}
    />
  );
}
