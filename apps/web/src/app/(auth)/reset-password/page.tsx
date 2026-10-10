import type { Metadata } from "next";

import { firstParam } from "@/lib/search-params";

import { Client } from "./Client";

export const metadata: Metadata = { title: "Nowe hasło – Hallway" };

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const params = await searchParams;
  // Better Auth redirects here with ?error=INVALID_TOKEN when the link is used up or expired
  const rejected = firstParam(params.error) !== undefined;

  return <Client token={rejected ? undefined : firstParam(params.token)} />;
}
