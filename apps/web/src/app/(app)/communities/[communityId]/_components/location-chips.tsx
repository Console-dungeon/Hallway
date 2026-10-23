import type { LocationSummary } from "@hallway/shared";
import { MapPin, Plus } from "lucide-react";

interface LocationChipsProps {
  /** Names the list for screen readers, e.g. "Części wspólne klatki A". */
  label: string;
  locations: LocationSummary[];
  /** Whether the viewer may manage common areas; without it the chips are read-only. */
  canManage: boolean;
  onAdd: () => void;
  onEdit: (location: LocationSummary) => void;
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
}: LocationChipsProps) {
  return (
    <ul
      aria-label={label}
      className="flex flex-wrap items-center gap-x-2 gap-y-2 data-empty:gap-x-3"
      data-empty={locations.length === 0 ? true : undefined}
    >
      {locations.length === 0 && (
        <li className="text-sm text-muted-foreground 2xl:text-base">
          Brak części wspólnych.
        </li>
      )}
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
