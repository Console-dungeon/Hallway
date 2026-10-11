import { invitationRoleLabels } from "@hallway/shared";
import { cn } from "cn";
import { Building2, DoorOpen, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getMe } from "@/lib/me";

export const metadata: Metadata = { title: "Pulpit – Hallway" };

export default async function DashboardPage() {
  const me = await getMe();
  // The layout has already sent visitors without a session to /login
  if (!me) return null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 pt-4 2xl:max-w-5xl 2xl:pt-8 3xl:max-w-7xl 3xl:gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight 2xl:text-4xl 3xl:text-5xl">
            Cześć, {me.user.name}
          </h1>
          <p className="text-lg text-muted-foreground 2xl:text-xl 3xl:text-2xl">
            Twoje wspólnoty i lokale.
          </p>
        </div>
        <Link
          href="/communities/new"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-12 gap-2 px-5 text-base 2xl:h-14 2xl:text-lg 3xl:h-16 3xl:px-7 3xl:text-xl",
          )}
        >
          <Plus className="size-5" />
          Załóż kolejną wspólnotę
        </Link>
      </div>

      {me.communities.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 3xl:gap-6">
          {me.communities.map((community) => (
            <li
              key={community.id}
              className="flex items-center gap-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10 3xl:gap-6 3xl:p-8"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-muted/40 3xl:size-16">
                <Building2 className="size-6 3xl:size-8" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-medium 2xl:text-xl 3xl:text-2xl">
                  {community.name}
                </p>
                <p className="text-base text-muted-foreground 3xl:text-xl">
                  {invitationRoleLabels[community.role]}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {me.units.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 3xl:gap-6">
          {me.units.map((unit) => (
            <li
              key={unit.id}
              className="flex items-center gap-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10 3xl:gap-6 3xl:p-8"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-muted/40 3xl:size-16">
                <DoorOpen className="size-6 3xl:size-8" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-medium 2xl:text-xl 3xl:text-2xl">
                  Lokal {unit.number}, {unit.buildingName}
                </p>
                <p className="truncate text-base text-muted-foreground 3xl:text-xl">
                  {unit.communityName} · {invitationRoleLabels[unit.role]}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
