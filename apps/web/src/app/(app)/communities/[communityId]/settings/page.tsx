import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCommunity } from "@/lib/communities";

import { Client } from "./Client";

export const metadata: Metadata = { title: "Ustawienia wspólnoty – Hallway" };

export default async function CommunitySettingsPage({
  params,
}: PageProps<"/communities/[communityId]/settings">) {
  const { communityId } = await params;
  const community = await getCommunity(communityId);
  // Settings are for admins only; for everyone else the page doesn't exist, like a
  // community they may not see
  if (
    !community ||
    !(
      community.actions.includes("community.update") ||
      community.actions.includes("community.delete")
    )
  ) {
    notFound();
  }

  return <Client community={community} />;
}
