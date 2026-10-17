import type { Me, UnitMember } from "@hallway/shared";
import { House } from "lucide-react";

import { unitPlace } from "@/lib/units";

import { PersonRow } from "./person-row";

interface OwnUnitCardProps {
  unit: Me["units"][number];
  members: UnitMember[];
  viewerId: string;
}

/** For owners and residents: their unit and who else is assigned to it, read-only. */
export function OwnUnitCard({ unit, members, viewerId }: OwnUnitCardProps) {
  return (
    <section
      aria-label={`Twój lokal ${unit.number}`}
      className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
    >
      <div className="flex items-center gap-3.5 px-4 py-4 sm:px-6 sm:py-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/40 2xl:size-12">
          <House className="size-5 2xl:size-6" />
        </span>
        <span className="min-w-0">
          <span className="block text-lg font-medium 2xl:text-xl">
            Twój lokal
          </span>
          <span className="block text-sm text-muted-foreground 2xl:text-base">
            {unitPlace(unit)}
          </span>
        </span>
      </div>
      <ul aria-label="Osoby w lokalu" className="divide-y border-t">
        {members.map((member) => (
          <PersonRow
            key={member.userId}
            person={member}
            isViewer={member.userId === viewerId}
          />
        ))}
      </ul>
    </section>
  );
}
