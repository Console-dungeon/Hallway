import { Plus, X } from "lucide-react";

import { FieldError } from "@/components/ui/field";

interface StaircaseChipsProps {
  staircases: string[];
  canAdd: boolean;
  /** False keeps the last staircase in place where at least one is required. */
  canRemove: boolean;
  onAdd: () => void;
  onRemove: (name: string) => void;
  error?: string | undefined;
}

const chipClassName =
  "inline-flex h-10 items-center rounded-lg border text-base font-medium 2xl:h-12 2xl:text-lg";

/** Staircases of a building being created: added with one click, removed with the ×. */
export function StaircaseChips({
  staircases,
  canAdd,
  canRemove,
  onAdd,
  onRemove,
  error,
}: StaircaseChipsProps) {
  return (
    <div className="flex flex-col gap-2">
      <p id="staircases-label" className="text-base font-medium 2xl:text-lg">
        Klatki schodowe
      </p>
      <ul aria-labelledby="staircases-label" className="flex flex-wrap gap-2">
        {staircases.map((name) => (
          <li
            key={name}
            className={`${chipClassName} gap-1 bg-card pl-3 ${canRemove ? "pr-1" : "pr-3"}`}
          >
            Klatka {name}
            {canRemove && (
              <button
                type="button"
                aria-label={`Usuń klatkę ${name}`}
                onClick={() => onRemove(name)}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </button>
            )}
          </li>
        ))}
        {canAdd && (
          <li>
            <button
              type="button"
              onClick={onAdd}
              className={`${chipClassName} gap-1.5 border-dashed px-3 text-muted-foreground outline-none hover:border-primary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring`}
            >
              <Plus className="size-4" />
              Dodaj klatkę
            </button>
          </li>
        )}
      </ul>
      <p className="text-sm text-muted-foreground 2xl:text-base">
        Budynek z jednym wejściem ma jedną klatkę.
      </p>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
