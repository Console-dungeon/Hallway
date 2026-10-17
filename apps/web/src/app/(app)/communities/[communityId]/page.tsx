import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCommunity } from "@/lib/communities";

import { Client } from "./Client";

export const metadata: Metadata = { title: "Wspólnota – Hallway" };

export default async function CommunityPage({
  params,
}: PageProps<"/communities/[communityId]">) {
  const { communityId } = await params;
  const community = await getCommunity(communityId);
  if (!community) notFound();

  return <Client community={community} />;
}
