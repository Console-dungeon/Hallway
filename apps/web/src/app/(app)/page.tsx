import { invitationRoleLabels } from "@hallway/shared";
import { cn } from "cn";
import { Building2, DoorOpen, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getMe } from "@/lib/me";

export const metadata: Metadata = { title: "Pulpit – Hallway" };

const tileClassName =
  "flex items-center gap-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10";

export default async function DashboardPage() {
  const me = await getMe();
  // The layout has already sent visitors without a session to /login
  if (!me) return null;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 pt-4 2xl:max-w-5xl 2xl:pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight 2xl:text-4xl">
            Cześć, {me.user.name}
          </h1>
          <p className="text-lg text-muted-foreground 2xl:text-xl">
            Twoje wspólnoty i lokale.
          </p>
        </div>
        <Link
          href="/communities/new"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-12 gap-2 px-5 text-base 2xl:h-14 2xl:text-lg",
          )}
        >
          <Plus className="size-5" />
          Załóż kolejną wspólnotę
        </Link>
      </div>

      {me.communities.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {me.communities.map((community) => {
            const content = (
              <>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-muted/40">
                  <Building2 className="size-6" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-lg font-medium 2xl:text-xl">
                    {community.name}
                  </span>
                  <span className="block text-base text-muted-foreground">
                    {invitationRoleLabels[community.role]}
                  </span>
                </span>
              </>
            );
            return (
              <li key={community.id}>
                {/* Contractors only work on issues assigned to them; they have no community page */}
                {community.role === "contractor" ? (
                  <div className={tileClassName}>{content}</div>
                ) : (
                  <Link
                    href={`/communities/${community.id}`}
                    className={`${tileClassName} transition outline-none hover:shadow-lg hover:ring-primary focus-visible:ring-2 focus-visible:ring-primary`}
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {me.units.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {me.units.map((unit) => (
            <li key={unit.id}>
              <Link
                href={`/communities/${unit.communityId}`}
                className={`${tileClassName} transition outline-none hover:shadow-lg hover:ring-primary focus-visible:ring-2 focus-visible:ring-primary`}
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-muted/40">
                  <DoorOpen className="size-6" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-lg font-medium 2xl:text-xl">
                    Lokal {unit.number}, {unit.buildingName}
                  </span>
                  <span className="block truncate text-base text-muted-foreground">
                    {unit.communityName} · {invitationRoleLabels[unit.role]}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
