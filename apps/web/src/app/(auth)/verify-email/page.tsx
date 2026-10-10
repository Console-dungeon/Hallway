import type { Metadata } from "next";

import { firstParam } from "@/lib/search-params";

import { Client } from "./Client";

export const metadata: Metadata = { title: "Potwierdź e-mail – Hallway" };

export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/verify-email">) {
  const email = firstParam((await searchParams).email);

  return <Client email={email} />;
}
