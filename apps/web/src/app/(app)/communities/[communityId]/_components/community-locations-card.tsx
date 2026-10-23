import type { LocationSummary } from "@hallway/shared";
import { MapPin } from "lucide-react";

import { CZESC_WSPOLNA, plural } from "@/lib/plural";

import { LocationChips } from "./location-chips";

interface CommunityLocationsCardProps {
  locations: LocationSummary[];
  canManage: boolean;
  onAdd: () => void;
  onEdit: (location: LocationSummary) => void;
}

/** Common areas of the community as a whole, e.g. the courtyard or the car park. */
export function CommunityLocationsCard({
  locations,
  canManage,
  onAdd,
  onEdit,
}: CommunityLocationsCardProps) {
  return (
    <section
      aria-label="Części wspólne wspólnoty"
      className="flex flex-col gap-4 rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10 sm:px-6 sm:py-5"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/40 2xl:size-12">
          <MapPin className="size-5 2xl:size-6" />
        </span>
        <span className="min-w-0">
          <span className="block text-lg font-medium 2xl:text-xl">
            Części wspólne wspólnoty
          </span>
          <span className="block text-sm text-muted-foreground 2xl:text-base">
            {locations.length === 0
              ? "Należą do całej wspólnoty, np. podwórko albo parking"
              : `Należą do całej wspólnoty · ${plural(locations.length, CZESC_WSPOLNA)}`}
          </span>
        </span>
      </div>
      <LocationChips
        label="Części wspólne wspólnoty"
        locations={locations}
        canManage={canManage}
        onAdd={onAdd}
        onEdit={onEdit}
      />
    </section>
  );
}
