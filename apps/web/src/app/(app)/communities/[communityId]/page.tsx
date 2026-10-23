import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCommunity } from "@/lib/communities";
import { getMe } from "@/lib/me";
import { serverClient } from "@/lib/orpc-server";
import { firstParam } from "@/lib/search-params";

import { Client } from "./Client";

export const metadata: Metadata = { title: "Wspólnota – Hallway" };

export default async function CommunityPage({
  params,
  searchParams,
}: PageProps<"/communities/[communityId]">) {
  const { communityId } = await params;
  const [community, me] = await Promise.all([
    getCommunity(communityId),
    getMe(),
  ]);
  if (!community || !me) notFound();

  // Admins manage people in the Members tab; the others only see who shares their units
  const canListMembers = community.actions.includes("members.list");
  const ownUnits = canListMembers
    ? []
    : me.units.filter((unit) => unit.communityId === communityId);
  const [members, ownUnitMembers] = await Promise.all([
    canListMembers ? serverClient.members.list({ communityId }) : undefined,
    Promise.all(
      ownUnits.map((unit) =>
        serverClient.unitMembers.list({ communityId, unitId: unit.id }),
      ),
    ),
  ]);

  const joined = firstParam((await searchParams).joined) === "1";

  return (
    <Client
      community={community}
      members={members}
      viewerId={me.user.id}
      ownUnits={ownUnits.map((unit, index) => ({
        unit,
        members: ownUnitMembers[index] ?? [],
      }))}
      joinedNotice={
        joined ? `Dołączono do wspólnoty ${community.name}` : undefined
      }
    />
  );
}
