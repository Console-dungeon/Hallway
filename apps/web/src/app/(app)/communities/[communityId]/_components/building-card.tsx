import type {
  BuildingDetail,
  StaircaseDetail,
  UnitDetail,
} from "@hallway/shared";
import { Building, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";

import { KLATKA, LOKAL, plural } from "@/lib/plural";

import { ActionButton } from "./action-button";

interface BuildingCardProps {
  building: BuildingDetail;
  /** Whether the viewer may change the structure; without it the card is read-only. */
  canManage: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onAddStaircase: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAddUnits: (staircase: StaircaseDetail) => void;
  onRenameStaircase: (staircase: StaircaseDetail) => void;
  onDeleteStaircase: (staircase: StaircaseDetail) => void;
  onEditUnit: (unit: UnitDetail) => void;
}

const unitClassName =
  "inline-flex h-9 min-w-12 items-center justify-center rounded-lg border bg-card px-2 text-sm font-medium 2xl:h-11 2xl:min-w-14 2xl:text-base 3xl:h-12 3xl:min-w-16 3xl:text-lg";

/** One building: its name and counts, and below them its staircases with their units. */
export function BuildingCard({
  building,
  canManage,
  collapsed,
  onToggle,
  onAddStaircase,
  onRename,
  onDelete,
  onAddUnits,
  onRenameStaircase,
  onDeleteStaircase,
  onEditUnit,
}: BuildingCardProps) {
  const units = building.staircases.reduce(
    (sum, staircase) => sum + staircase.units.length,
    0,
  );

  return (
    <section
      aria-label={`Budynek ${building.name}`}
      className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 3xl:px-8 3xl:py-6">
        <button
          type="button"
          aria-expanded={!collapsed}
          onClick={onToggle}
          className="flex min-w-0 flex-1 basis-full items-center gap-3.5 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring sm:basis-0"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/40 2xl:size-12 3xl:size-14">
            <Building className="size-5 2xl:size-6 3xl:size-7" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-medium 2xl:text-xl 3xl:text-2xl">
              {building.name}
            </span>
            <span className="block text-sm text-muted-foreground 2xl:text-base 3xl:text-lg">
              {plural(building.staircases.length, KLATKA)} ·{" "}
              {plural(units, LOKAL)}
            </span>
          </span>
        </button>
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          {canManage && (
            <>
              <ActionButton
                icon={Plus}
                label="Dodaj klatkę"
                showLabel
                onClick={onAddStaircase}
              />
              <ActionButton
                icon={Pencil}
                label={`Zmień nazwę budynku ${building.name}`}
                onClick={onRename}
              />
              <ActionButton
                icon={Trash2}
                label={`Usuń budynek ${building.name}`}
                onClick={onDelete}
              />
            </>
          )}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={onToggle}
            className="flex size-10 items-center justify-center text-muted-foreground"
          >
            <ChevronDown
              className={`size-5 transition-transform 2xl:size-6 ${collapsed ? "-rotate-90" : ""}`}
            />
          </button>
        </div>
      </div>

      {!collapsed && (
        <ul className="divide-y border-t">
          {building.staircases.length === 0 && (
            <li className="px-4 py-4 text-sm text-muted-foreground sm:px-6 2xl:text-base 3xl:px-8">
              {canManage
                ? "Ten budynek nie ma jeszcze klatek. Dodaj pierwszą, żeby móc dodawać lokale."
                : "Ten budynek nie ma jeszcze klatek."}
            </li>
          )}
          {building.staircases.map((staircase) => (
            <li
              key={staircase.id}
              aria-label={`Klatka ${staircase.name}`}
              className="flex flex-col gap-3 px-4 py-4 sm:px-6 3xl:px-8 3xl:py-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-baseline gap-2.5">
                  <span className="text-base font-medium 2xl:text-lg 3xl:text-xl">
                    Klatka {staircase.name}
                  </span>
                  <span className="text-sm text-muted-foreground 2xl:text-base 3xl:text-lg">
                    {plural(staircase.units.length, LOKAL)}
                  </span>
                </p>
                {canManage && (
                  <div className="flex items-center gap-2">
                    <ActionButton
                      icon={Plus}
                      label="Dodaj lokale"
                      showLabel
                      onClick={() => onAddUnits(staircase)}
                    />
                    <ActionButton
                      icon={Pencil}
                      label={`Zmień nazwę klatki ${staircase.name}`}
                      onClick={() => onRenameStaircase(staircase)}
                    />
                    <ActionButton
                      icon={Trash2}
                      label={`Usuń klatkę ${staircase.name}`}
                      onClick={() => onDeleteStaircase(staircase)}
                    />
                  </div>
                )}
              </div>
              {staircase.units.length === 0 ? (
                <p className="text-sm text-muted-foreground 2xl:text-base">
                  {canManage
                    ? "Brak lokali. Dodaj je pojedynczo albo całą serią."
                    : "Brak lokali."}
                </p>
              ) : (
                <ul
                  aria-label={`Lokale klatki ${staircase.name}`}
                  className="flex flex-wrap gap-2"
                >
                  {staircase.units.map((unit) => (
                    <li key={unit.id}>
                      {canManage ? (
                        <button
                          type="button"
                          aria-label={`Lokal ${unit.number}`}
                          onClick={() => onEditUnit(unit)}
                          className={`${unitClassName} outline-none hover:border-primary focus-visible:ring-2 focus-visible:ring-ring`}
                        >
                          {unit.number}
                        </button>
                      ) : (
                        <span className={unitClassName}>{unit.number}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
