"use client";

import {
  type CommunityDetail,
  type CommunityMember,
  communityMemberRoles,
  invitationRoleLabels,
  type Me,
  type UnitMember,
  unitMemberRoles,
} from "@hallway/shared";
import { cn } from "cn";
import { Building, ChevronRight, Plus, Settings } from "lucide-react";
import Link from "next/link";

import { SegmentedControl } from "@/components/segmented-control";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  buildingLocationCount,
  locationPlaceFrom,
  locationPlaceLabel,
} from "@/lib/locations";
import { CZESC_WSPOLNA, KLATKA, LOKAL, plural } from "@/lib/plural";
import { unitPlace } from "@/lib/units";

import { BuildingCard } from "./_components/building-card";
import { BuildingDialog } from "./_components/building-dialog";
import { CommunityLocationsCard } from "./_components/community-locations-card";
import { ConfirmDialog } from "./_components/confirm-dialog";
import { InviteDialog } from "./_components/invite-dialog";
import { LocationDialog } from "./_components/location-dialog";
import { MembersCard } from "./_components/members-card";
import { NameDialog } from "./_components/name-dialog";
import { OwnUnitCard } from "./_components/own-unit-card";
import { RoleDialog } from "./_components/role-dialog";
import { UnitDialog } from "./_components/unit-dialog";
import { UnitPeople } from "./_components/unit-people";
import { UnitsDialog } from "./_components/units-dialog";
import { type CommunityTab, useController } from "./useController";

interface ClientProps {
  /** The community as loaded on the server; the page keeps it fresh after every change. */
  community: CommunityDetail;
  /** Admins, workers and contractors; only for those who may list them. */
  members?: CommunityMember[] | undefined;
  viewerId: string;
  /** The viewer's units here with their people; shown to those without the Members tab. */
  ownUnits: { unit: Me["units"][number]; members: UnitMember[] }[];
  /** Confirmation of joining on the way here, shown once as a toast. */
  joinedNotice?: string | undefined;
}

const TABS: readonly { value: CommunityTab; label: string }[] = [
  { value: "structure", label: "Struktura" },
  { value: "members", label: "Członkowie" },
];

const headerButtonClassName =
  "h-12 gap-2 px-5 text-base 2xl:h-14 2xl:px-6 2xl:text-lg";

/** What the viewer is here, for the line under the community's name. */
function roleLabel(community: CommunityDetail) {
  if (community.memberRole) return invitationRoleLabels[community.memberRole];
  return community.hasUnits ? "Mieszkaniec" : "Podgląd";
}

export function Client({
  community: initial,
  members: initialMembers,
  viewerId,
  ownUnits,
  joinedNotice,
}: ClientProps) {
  const {
    community,
    canManage,
    canManageLocations,
    canOpenSettings,
    tab,
    selectTab,
    members,
    unitMembers,
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
    onLocationSubmit,
    confirmDelete,
    onInviteSubmit,
    onRoleSubmit,
    roleForm,
    buildingForm,
    unitsForm,
  } = useController({
    community: initial,
    members: initialMembers,
    viewerId,
    joinedNotice,
  });

  // The main action of the open tab, next to the settings
  const headerAction =
    tab === "structure"
      ? canManage && community.buildings.length > 0
        ? { label: "Dodaj budynek", dialog: "addBuilding" as const }
        : undefined
      : members.canInviteToCommunity
        ? { label: "Zaproś do wspólnoty", dialog: "inviteToCommunity" as const }
        : undefined;

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
        {(canOpenSettings || headerAction) && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
            {canOpenSettings && (
              <Link
                href={`/communities/${community.id}/settings`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  headerButtonClassName,
                  "px-4 sm:px-5",
                )}
              >
                <Settings className="size-5" />
                Ustawienia
              </Link>
            )}
            {headerAction && (
              <Button
                className={cn(
                  headerButtonClassName,
                  "flex-1 px-4 sm:flex-none sm:px-5",
                )}
                onClick={() => open({ type: headerAction.dialog })}
              >
                <Plus className="size-5" />
                {headerAction.label}
              </Button>
            )}
          </div>
        )}
      </div>

      {members.canList && (
        <SegmentedControl
          kind="tabs"
          label="Widok wspólnoty"
          options={TABS}
          value={tab}
          onChange={selectTab}
        />
      )}

      {tab === "members" ? (
        <>
          <p className="text-base text-muted-foreground 2xl:text-lg">
            Administratorzy, pracownicy i wykonawcy wspólnoty. Właścicieli i
            mieszkańców zapraszasz z lokalu – kliknij jego numer na karcie
            Struktura.
          </p>
          <MembersCard
            members={members.list}
            viewerId={viewerId}
            canManage={members.canManage}
            onChangeRole={(member) => open({ type: "changeRole", member })}
            onRemove={(member) => open({ type: "removeMember", member })}
          />
        </>
      ) : (
        ownUnits.map(({ unit, members: people }) => (
          <OwnUnitCard
            key={unit.id}
            unit={unit}
            members={people}
            viewerId={viewerId}
          />
        ))
      )}

      {tab === "structure" && (
        <CommunityLocationsCard
          locations={community.locations}
          canManage={canManageLocations}
          onAdd={() =>
            open({ type: "addLocation", place: { level: "community" } })
          }
          onEdit={(location) =>
            open({
              type: "editLocation",
              location,
              place: { level: "community" },
            })
          }
        />
      )}

      {tab === "members" ? null : community.buildings.length === 0 ? (
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
              className={headerButtonClassName}
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
              onEditUnit={(unit, staircase) =>
                open({ type: "editUnit", unit, building, staircase })
              }
              canManageLocations={canManageLocations}
              onAddLocation={(staircase) =>
                open({
                  type: "addLocation",
                  place: staircase
                    ? { level: "staircase", building, staircase }
                    : { level: "building", building },
                })
              }
              onEditLocation={(location, staircase) =>
                open({
                  type: "editLocation",
                  location,
                  place: staircase
                    ? { level: "staircase", building, staircase }
                    : { level: "building", building },
                })
              }
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
          place={`${dialog.building.name} · Klatka ${dialog.staircase.name}`}
          people={
            members.canList && (
              <UnitPeople
                members={unitMembers.list}
                error={unitMembers.error}
                viewerId={viewerId}
                canInvite={members.canInviteToUnit}
                canManage={members.canManage}
                onInvite={() => open({ ...dialog, type: "inviteToUnit" })}
                onChangeRole={(member) =>
                  open({ type: "changeUnitRole", unit: dialog.unit, member })
                }
                onRemove={(member) =>
                  open({ type: "removeUnitMember", unit: dialog.unit, member })
                }
              />
            )
          }
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
          description={`Zniknie razem z klatkami (${plural(dialog.building.staircases.length, KLATKA)}), lokalami (${plural(
            dialog.building.staircases.reduce(
              (sum, staircase) => sum + staircase.units.length,
              0,
            ),
            LOKAL,
          )}) i częściami wspólnymi (${plural(buildingLocationCount(dialog.building), CZESC_WSPOLNA)}). Tej operacji nie da się cofnąć.`}
          confirm={{ label: "Usuń budynek", onConfirm: confirmDelete }}
          formError={formError}
          isPending={isPending}
          onClose={close}
        />
      )}
      {dialog?.type === "deleteStaircase" && (
        <ConfirmDialog
          title={`Usunąć klatkę ${dialog.staircase.name}?`}
          description={`Zniknie razem z lokalami (${plural(dialog.staircase.units.length, LOKAL)}) i częściami wspólnymi (${plural(dialog.staircase.locations.length, CZESC_WSPOLNA)}). Tej operacji nie da się cofnąć.`}
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
      {dialog?.type === "addLocation" && (
        <NameDialog
          title="Dodaj część wspólną"
          description={locationPlaceLabel(dialog.place)}
          label="Nazwa"
          placeholder="np. Winda albo wózkownia"
          submitLabel="Dodaj"
          error={errors.name}
          formError={formError}
          isPending={isPending}
          onSubmit={onLocationSubmit}
          onClose={close}
        />
      )}
      {dialog?.type === "editLocation" && (
        <LocationDialog
          location={dialog.location}
          place={locationPlaceLabel(dialog.place)}
          error={errors.name}
          formError={formError}
          isPending={isPending}
          onSubmit={onLocationSubmit}
          onDelete={() => open({ ...dialog, type: "deleteLocation" })}
          onClose={close}
        />
      )}
      {dialog?.type === "deleteLocation" && (
        <ConfirmDialog
          title={`Usunąć część wspólną ${dialog.location.name}?`}
          description={`Zniknie ${locationPlaceFrom(dialog.place)}. Tej operacji nie da się cofnąć.`}
          confirm={{ label: "Usuń część wspólną", onConfirm: confirmDelete }}
          formError={formError}
          isPending={isPending}
          onClose={close}
        />
      )}
      {dialog?.type === "inviteToCommunity" && (
        <InviteDialog
          title="Zaproś do wspólnoty"
          description={community.name}
          roles={communityMemberRoles}
          form={roleForm}
          errors={errors}
          formError={formError}
          isPending={isPending}
          onSubmit={onInviteSubmit}
          onClose={close}
        />
      )}
      {dialog?.type === "inviteToUnit" && (
        <InviteDialog
          title="Zaproś do lokalu"
          description={unitPlace({
            buildingName: dialog.building.name,
            staircaseName: dialog.staircase.name,
            number: dialog.unit.number,
          })}
          roles={unitMemberRoles}
          form={roleForm}
          errors={errors}
          formError={formError}
          isPending={isPending}
          onSubmit={onInviteSubmit}
          onClose={close}
        />
      )}
      {dialog?.type === "changeRole" && (
        <RoleDialog
          title="Zmień rolę"
          description={`${dialog.member.name} · ${dialog.member.email}`}
          roles={communityMemberRoles}
          role={roleForm.role}
          setRole={roleForm.setRole}
          companyName={dialog.member.companyName}
          errors={errors}
          formError={formError}
          isPending={isPending}
          onSubmit={onRoleSubmit}
          onClose={close}
        />
      )}
      {dialog?.type === "changeUnitRole" && (
        <RoleDialog
          title="Zmień rolę w lokalu"
          description={`${dialog.member.name} · Lokal ${dialog.unit.number}`}
          roles={unitMemberRoles}
          role={roleForm.role}
          setRole={roleForm.setRole}
          errors={errors}
          formError={formError}
          isPending={isPending}
          onSubmit={onRoleSubmit}
          onClose={close}
        />
      )}
      {dialog?.type === "removeMember" && (
        <ConfirmDialog
          title="Usunąć osobę ze wspólnoty?"
          description={`${dialog.member.name} (${dialog.member.email}) straci rolę we wspólnocie ${community.name}. Przypisania do lokali zostaną bez zmian.`}
          confirm={{ label: "Usuń ze wspólnoty", onConfirm: confirmDelete }}
          formError={formError}
          isPending={isPending}
          onClose={close}
        />
      )}
      {dialog?.type === "removeUnitMember" && (
        <ConfirmDialog
          title={`Usunąć osobę z lokalu ${dialog.unit.number}?`}
          description={`${dialog.member.name} (${dialog.member.email}) – przypisanie do tego lokalu zostanie usunięte. Bez innego lokalu ani roli we wspólnocie ta osoba straci do niej dostęp.`}
          confirm={{ label: "Usuń z lokalu", onConfirm: confirmDelete }}
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
