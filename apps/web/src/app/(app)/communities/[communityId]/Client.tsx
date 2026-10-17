"use client";

import { type CommunityDetail, invitationRoleLabels } from "@hallway/shared";
import { Building, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { KLATKA, LOKAL, plural } from "@/lib/plural";

import { BuildingCard } from "./_components/building-card";
import { BuildingDialog } from "./_components/building-dialog";
import { ConfirmDialog } from "./_components/confirm-dialog";
import { NameDialog } from "./_components/name-dialog";
import { UnitDialog } from "./_components/unit-dialog";
import { UnitsDialog } from "./_components/units-dialog";
import { useController } from "./useController";

interface ClientProps {
  /** The community as loaded on the server; the page keeps it fresh after every change. */
  community: CommunityDetail;
}

const addBuildingClassName =
  "h-12 gap-2 px-5 text-base 2xl:h-14 2xl:px-6 2xl:text-lg";

/** What the viewer is here, for the line under the community's name. */
function roleLabel(community: CommunityDetail) {
  if (community.memberRole) return invitationRoleLabels[community.memberRole];
  return community.hasUnits ? "Mieszkaniec" : "Podgląd";
}

export function Client({ community: initial }: ClientProps) {
  const {
    community,
    canManage,
    isCollapsed,
    toggleBuilding,
    dialog,
    open,
    close,
    errors,
    formError,
    isPending,
    onBuildingSubmit,
    onNameSubmit,
    onUnitsSubmit,
    onUnitSubmit,
    confirmDelete,
    buildingForm,
    unitsForm,
  } = useController(initial);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pt-2 2xl:max-w-6xl 2xl:gap-8 2xl:pt-6">
      <nav
        aria-label="Okruszki"
        className="flex items-center gap-1.5 text-sm text-muted-foreground 2xl:text-base"
      >
        <Link href="/" className="underline-offset-4 hover:underline">
          Pulpit
        </Link>
        <ChevronRight className="size-4" />
        <span className="truncate font-medium text-foreground">
          {community.name}
        </span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl 2xl:text-4xl">
            {community.name}
          </h1>
          <p className="text-base text-muted-foreground 2xl:text-lg">
            {community.address} · {roleLabel(community)}
          </p>
        </div>
        {canManage && community.buildings.length > 0 && (
          <Button
            className={`${addBuildingClassName} w-full sm:w-auto`}
            onClick={() => open({ type: "addBuilding" })}
          >
            <Plus className="size-5" />
            Dodaj budynek
          </Button>
        )}
      </div>

      {community.buildings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-card px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-xl border bg-muted/40">
            <Building className="size-7" />
          </span>
          <div>
            <p className="text-xl font-medium 2xl:text-2xl">
              Ta wspólnota nie ma jeszcze budynków
            </p>
            <p className="text-base text-muted-foreground 2xl:text-lg">
              {canManage
                ? "Dodaj pierwszy budynek z klatkami, a potem lokale."
                : "Administrator nie dodał jeszcze żadnego budynku."}
            </p>
          </div>
          {canManage && (
            <Button
              className={addBuildingClassName}
              onClick={() => open({ type: "addBuilding" })}
            >
              <Plus className="size-5" />
              Dodaj budynek
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 2xl:gap-6">
          {community.buildings.map((building) => (
            <BuildingCard
              key={building.id}
              building={building}
              canManage={canManage}
              collapsed={isCollapsed(building.id)}
              onToggle={() => toggleBuilding(building.id)}
              onAddStaircase={() => open({ type: "addStaircase", building })}
              onRename={() => open({ type: "renameBuilding", building })}
              onDelete={() => open({ type: "deleteBuilding", building })}
              onAddUnits={(staircase) =>
                open({ type: "addUnits", building, staircase })
              }
              onRenameStaircase={(staircase) =>
                open({ type: "renameStaircase", staircase })
              }
              onDeleteStaircase={(staircase) =>
                open({ type: "deleteStaircase", staircase })
              }
              onEditUnit={(unit) => open({ type: "editUnit", unit })}
            />
          ))}
        </div>
      )}

      {dialog?.type === "addBuilding" && (
        <BuildingDialog
          form={buildingForm}
          errors={errors}
          formError={formError}
          isPending={isPending}
          onSubmit={onBuildingSubmit}
          onClose={close}
        />
      )}
      {dialog?.type === "renameBuilding" && (
        <NameDialog
          title="Zmień nazwę budynku"
          label="Nazwa budynku"
          defaultValue={dialog.building.name}
          submitLabel="Zapisz"
          error={errors.name}
          formError={formError}
          isPending={isPending}
          onSubmit={onNameSubmit}
          onClose={close}
        />
      )}
      {dialog?.type === "addStaircase" && (
        <NameDialog
          title="Dodaj klatkę"
          description={`Budynek ${dialog.building.name}`}
          label="Nazwa klatki"
          placeholder="np. A albo 1"
          submitLabel="Dodaj klatkę"
          error={errors.name}
          formError={formError}
          isPending={isPending}
          onSubmit={onNameSubmit}
          onClose={close}
        />
      )}
      {dialog?.type === "renameStaircase" && (
        <NameDialog
          title="Zmień nazwę klatki"
          label="Nazwa klatki"
          defaultValue={dialog.staircase.name}
          submitLabel="Zapisz"
          error={errors.name}
          formError={formError}
          isPending={isPending}
          onSubmit={onNameSubmit}
          onClose={close}
        />
      )}
      {dialog?.type === "addUnits" && (
        <UnitsDialog
          place={`${dialog.building.name}, klatka ${dialog.staircase.name}`}
          form={unitsForm}
          errors={errors}
          formError={formError}
          isPending={isPending}
          onSubmit={onUnitsSubmit}
          onClose={close}
        />
      )}
      {dialog?.type === "editUnit" && (
        <UnitDialog
          unit={dialog.unit}
          errors={errors}
          formError={formError}
          isPending={isPending}
          onSubmit={onUnitSubmit}
          onDelete={() => open({ type: "deleteUnit", unit: dialog.unit })}
          onClose={close}
        />
      )}
      {dialog?.type === "deleteBuilding" && (
        <ConfirmDialog
          title={`Usunąć budynek ${dialog.building.name}?`}
          description={`Zniknie razem z klatkami (${plural(dialog.building.staircases.length, KLATKA)}) i lokalami (${plural(
            dialog.building.staircases.reduce(
              (sum, staircase) => sum + staircase.units.length,
              0,
            ),
            LOKAL,
          )}). Tej operacji nie da się cofnąć.`}
          confirm={{ label: "Usuń budynek", onConfirm: confirmDelete }}
          formError={formError}
          isPending={isPending}
          onClose={close}
        />
      )}
      {dialog?.type === "deleteStaircase" && (
        <ConfirmDialog
          title={`Usunąć klatkę ${dialog.staircase.name}?`}
          description={`Zniknie razem z lokalami (${plural(dialog.staircase.units.length, LOKAL)}). Tej operacji nie da się cofnąć.`}
          confirm={{ label: "Usuń klatkę", onConfirm: confirmDelete }}
          formError={formError}
          isPending={isPending}
          onClose={close}
        />
      )}
      {dialog?.type === "deleteUnit" && (
        <ConfirmDialog
          title={`Usunąć lokal ${dialog.unit.number}?`}
          description="Tej operacji nie da się cofnąć."
          confirm={{ label: "Usuń lokal", onConfirm: confirmDelete }}
          formError={formError}
          isPending={isPending}
          onClose={close}
        />
      )}
      {dialog?.type === "refused" && (
        <ConfirmDialog
          title={dialog.title}
          description={dialog.message}
          onClose={close}
        />
      )}
    </div>
  );
}
