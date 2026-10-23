import type { LocationSummary } from "@hallway/shared";
import { MapPin, Plus } from "lucide-react";

import { EmptyState } from "./empty-state";

interface LocationChipsProps {
  /** Names the list for screen readers, e.g. "Części wspólne klatki A". */
  label: string;
  locations: LocationSummary[];
  /** Whether the viewer may manage common areas; without it the chips are read-only. */
  canManage: boolean;
  onAdd: () => void;
  onEdit: (location: LocationSummary) => void;
  /** Examples for this place shown to an admin when it has none, e.g. "np. winda albo wózkownia". */
  emptyHint: string;
  /** How the placeholder looks when there are no common areas. */
  emptyLayout?: "tile" | "row";
}

const chipClassName =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium 2xl:h-11 2xl:text-base";

/** Common areas of one place as chips; an admin opens one to edit it or adds a new one. */
export function LocationChips({
  label,
  locations,
  canManage,
  onAdd,
  onEdit,
  emptyHint,
  emptyLayout = "row",
}: LocationChipsProps) {
  if (locations.length === 0) {
    // The placeholder stays inside the named list, so it is found with the chips' place
    return (
      <ul aria-label={label} className="grid">
        <li className="flex">
          <EmptyState
            layout={emptyLayout}
            icon={MapPin}
            title="Brak części wspólnych"
            hint={
              canManage
                ? emptyHint
                : "Administrator jeszcze nie dodał części wspólnych."
            }
            action={
              canManage
                ? { label: "Dodaj część wspólną", onClick: onAdd }
                : undefined
            }
            className="flex-1"
          />
        </li>
      </ul>
    );
  }

  return (
    <ul aria-label={label} className="flex flex-wrap items-center gap-2">
      {locations.map((location) => {
        const content = (
          <>
            <MapPin className="size-3.5 text-muted-foreground 2xl:size-4" />
            {location.name}
          </>
        );
        return (
          <li key={location.id}>
            {canManage ? (
              <button
                type="button"
                onClick={() => onEdit(location)}
                className={`${chipClassName} cursor-pointer bg-muted/40 outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring`}
              >
                {content}
              </button>
            ) : (
              <span className={`${chipClassName} bg-muted/40`}>{content}</span>
            )}
          </li>
        );
      })}
      {canManage && (
        <li>
          <button
            type="button"
            onClick={onAdd}
            className={`${chipClassName} cursor-pointer border-dashed text-muted-foreground outline-none hover:border-foreground/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring`}
          >
            <Plus className="size-4" />
            Dodaj część wspólną
          </button>
        </li>
      )}
    </ul>
  );
}
