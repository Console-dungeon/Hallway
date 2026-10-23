import {
  type BuildingDetail,
  buildingNameFormSchema,
  buildingSchema,
  communityInvitationSchema,
  type CommunityDetail,
  type CommunityMember,
  type InvitationRole,
  type LocationSummary,
  locationSchema,
  type StaircaseDetail,
  staircaseSchema,
  type UnitDetail,
  unitInvitationSchema,
  type UnitMember,
  unitSchema,
  unitSeriesSchema,
  updateCommunityMemberSchema,
  updateUnitMemberSchema,
} from "@hallway/shared";
import { ORPCError } from "@orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { type FieldErrors, parseValues } from "@/lib/form";
import { type LocationPlace, locationTakenMessage } from "@/lib/locations";
import { client, orpc } from "@/lib/orpc";
import { LOKAL, plural } from "@/lib/plural";
import { canAddStaircase, withNextStaircase } from "@/lib/staircases";

/** A unit together with where it is, for the unit window and the ones opened from it. */
export interface UnitInPlace {
  unit: UnitDetail;
  building: BuildingDetail;
  staircase: StaircaseDetail;
}

/** The window currently open over the page, with what it is about. */
export type StructureDialog =
  | { type: "addBuilding" }
  | { type: "renameBuilding"; building: BuildingDetail }
  | { type: "deleteBuilding"; building: BuildingDetail }
  | { type: "addStaircase"; building: BuildingDetail }
  | { type: "renameStaircase"; staircase: StaircaseDetail }
  | { type: "deleteStaircase"; staircase: StaircaseDetail }
  | { type: "addUnits"; building: BuildingDetail; staircase: StaircaseDetail }
  | ({ type: "editUnit" } & UnitInPlace)
  | { type: "deleteUnit"; unit: UnitDetail }
  | { type: "addLocation"; place: LocationPlace }
  | { type: "editLocation"; location: LocationSummary; place: LocationPlace }
  | { type: "deleteLocation"; location: LocationSummary; place: LocationPlace }
  | { type: "inviteToCommunity" }
  | { type: "changeRole"; member: CommunityMember }
  | { type: "removeMember"; member: CommunityMember }
  | ({ type: "inviteToUnit" } & UnitInPlace)
  | { type: "changeUnitRole"; unit: UnitDetail; member: UnitMember }
  | { type: "removeUnitMember"; unit: UnitDetail; member: UnitMember }
  | { type: "refused"; title: string; message: string };

export type UnitsMode = "series" | "single";

/** Tabs of an admin's community page; the chosen one is kept in ?tab=. */
export type CommunityTab = "structure" | "members";

type Errors = FieldErrors<{
  name: string;
  staircases: string;
  number: string;
  floor: string;
  from: string;
  to: string;
  email: string;
  role: string;
  companyName: string;
}>;

function hasCode(error: unknown, code: string) {
  return error instanceof ORPCError && error.code === code;
}

/**
 * Refusals that get their own window instead of an alert in the form, with what the
 * window says (the API's message, completed where the design says more).
 */
const refusals: Record<string, (message: string) => string> = {
  UNIT_HAS_MEMBERS: (message) => message,
  LAST_ADMIN: (message) => `${message} Najpierw nadaj tę rolę innej osobie.`,
};

function isRefusal(error: unknown): error is ORPCError<string, unknown> {
  return error instanceof ORPCError && error.code in refusals;
}

/** A form value that may be missing (a field shown only for some roles). */
function optional(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : undefined;
}

/** An empty field means "no floor"; anything else must be a number. */
function floorFrom(value: FormDataEntryValue | null) {
  return value === null || value === "" ? null : Number(value);
}

/** The number after the highest numeric unit of the staircase, as the start of a series. */
function nextUnitNumber(staircase: StaircaseDetail) {
  const numbers = staircase.units
    .map((unit) => Number(unit.number))
    .filter(Number.isInteger);
  return String(Math.max(0, ...numbers) + 1);
}

const unitTaken = { number: "Lokal o tym numerze już istnieje w tej klatce" };

interface ControllerProps {
  community: CommunityDetail;
  /** Members as loaded on the server; only for those who may list them. */
  members?: CommunityMember[] | undefined;
  /** The signed-in user, to mark them "(Ty)" and to notice changes to themselves. */
  viewerId: string;
  /** Message about joining on the way here (?joined); shown once as a toast. */
  joinedNotice?: string | undefined;
}

export function useController({
  community: initial,
  members: initialMembers,
  viewerId,
  joinedNotice,
}: ControllerProps) {
  const communityId = initial.id;
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dialog, setDialog] = useState<StructureDialog | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [staircases, setStaircases] = useState(["A"]);
  const [unitsMode, setUnitsMode] = useState<UnitsMode>("series");
  const [seriesFrom, setSeriesFrom] = useState("");
  const [seriesTo, setSeriesTo] = useState("");
  // Invitation and role windows: the e-mail is repeated in the hint, the role picks fields
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitationRole>("admin");

  const community = useQuery(
    orpc.communities.get.queryOptions({
      input: { communityId },
      initialData: initial,
    }),
  ).data;
  const can = (action: CommunityDetail["actions"][number]) =>
    community.actions.includes(action);
  const canListMembers = can("members.list");

  const tab: CommunityTab =
    canListMembers && searchParams.get("tab") === "members"
      ? "members"
      : "structure";

  // The tab lives in the address, so a reload or a shared link opens the same one
  function selectTab(next: CommunityTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "members") params.set("tab", "members");
    else params.delete("tab");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : pathname);
  }

  const members = useQuery({
    ...orpc.members.list.queryOptions({
      input: { communityId },
      initialData: initialMembers,
    }),
    enabled: canListMembers,
  }).data;

  // People of the unit whose window is open (admins see every unit)
  const openUnitId = dialog?.type === "editUnit" ? dialog.unit.id : "";
  const unitMembers = useQuery({
    ...orpc.unitMembers.list.queryOptions({
      input: { communityId, unitId: openUnitId },
    }),
    enabled: canListMembers && openUnitId !== "",
  });

  // Show the joining confirmation once, then drop it from the address so a refresh
  // doesn't repeat it. The toast id keeps a re-run of the effect from stacking toasts.
  useEffect(() => {
    if (!joinedNotice) return;
    toast.success(joinedNotice, { id: joinedNotice });
    router.replace(pathname, { scroll: false });
  }, [joinedNotice, pathname, router]);

  /**
   * Every change goes through here: it runs, the page reloads its data, the window closes
   * and the returned sentence is shown as a toast.
   */
  const change = useMutation({
    mutationFn: (run: () => Promise<string>) => run(),
    onSuccess: async (message) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: orpc.communities.get.key({ input: { communityId } }),
        }),
        queryClient.invalidateQueries({ queryKey: orpc.members.key() }),
        queryClient.invalidateQueries({ queryKey: orpc.unitMembers.key() }),
      ]);
      setDialog(null);
      toast.success(message);
    },
  });

  function open(next: StructureDialog) {
    setErrors({});
    change.reset();
    if (next.type === "addBuilding") setStaircases(["A"]);
    if (next.type === "addUnits") {
      setUnitsMode("series");
      setSeriesFrom(nextUnitNumber(next.staircase));
      setSeriesTo("");
    }
    if (next.type === "inviteToCommunity" || next.type === "inviteToUnit") {
      setEmail("");
      setRole(next.type === "inviteToCommunity" ? "admin" : "owner");
    }
    if (next.type === "changeRole" || next.type === "changeUnitRole") {
      setRole(next.member.role);
    }
    setDialog(next);
  }

  function close() {
    setDialog(null);
  }

  /** Replaces the open window with the one that says why the change was refused. */
  function showRefusal(error: unknown, title: string) {
    if (isRefusal(error)) {
      const message = refusals[error.code]?.(error.message) ?? error.message;
      setDialog({ type: "refused", title, message });
    }
  }

  /**
   * Shows field errors, or runs the change with the validated data. A name or number
   * that is already taken comes back from the API and lands under its field; a refusal
   * opens its own window with the given title. `onDone` runs after the success toast.
   */
  function submit<T>(
    parsed: { data?: T | undefined; errors?: Errors | undefined },
    run: (data: T) => Promise<string>,
    taken: Errors,
    refusedTitle = "",
    onDone?: () => void,
  ) {
    setErrors(parsed.errors ?? {});
    const { data } = parsed;
    if (data === undefined) return;
    change.mutate(() => run(data), {
      onSuccess: () => onDone?.(),
      onError: (error) => {
        if (hasCode(error, "CONFLICT")) setErrors(taken);
        else showRefusal(error, refusedTitle);
      },
    });
  }

  function onBuildingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    submit(
      parseValues(buildingSchema, { name: form.get("name"), staircases }),
      async (building) => {
        await client.structure.buildings.create({ communityId, ...building });
        return `Dodano budynek ${building.name}.`;
      },
      { name: "Budynek o tej nazwie już istnieje w tej wspólnocie" },
    );
  }

  /** One text field: a building's new name, or the name of a new or renamed staircase. */
  function onNameSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = { name: new FormData(event.currentTarget).get("name") };
    const buildingTaken = {
      name: "Budynek o tej nazwie już istnieje w tej wspólnocie",
    };
    const staircaseTaken = {
      name: "Klatka o tej nazwie już istnieje w tym budynku",
    };
    if (dialog?.type === "renameBuilding") {
      const buildingId = dialog.building.id;
      submit(
        parseValues(buildingNameFormSchema, values),
        async ({ name }) => {
          await client.structure.buildings.update({
            communityId,
            buildingId,
            name,
          });
          return "Zmieniono nazwę budynku.";
        },
        buildingTaken,
      );
    }
    if (dialog?.type === "addStaircase") {
      const buildingId = dialog.building.id;
      submit(
        parseValues(staircaseSchema, values),
        async ({ name }) => {
          await client.structure.staircases.create({
            communityId,
            buildingId,
            name,
          });
          return `Dodano klatkę ${name}.`;
        },
        staircaseTaken,
      );
    }
    if (dialog?.type === "renameStaircase") {
      const staircaseId = dialog.staircase.id;
      submit(
        parseValues(staircaseSchema, values),
        async ({ name }) => {
          await client.structure.staircases.update({
            communityId,
            staircaseId,
            name,
          });
          return "Zmieniono nazwę klatki.";
        },
        staircaseTaken,
      );
    }
  }

  function onUnitsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dialog?.type !== "addUnits") return;
    const staircaseId = dialog.staircase.id;

    if (unitsMode === "series") {
      submit(
        parseValues(unitSeriesSchema, {
          from: seriesFrom === "" ? undefined : Number(seriesFrom),
          to: seriesTo === "" ? undefined : Number(seriesTo),
        }),
        async (series) => {
          const { created, skipped } =
            await client.structure.units.createSeries({
              communityId,
              staircaseId,
              ...series,
            });
          const added = `Dodano ${plural(created, LOKAL)}`;
          return skipped > 0
            ? `${added}, pominięto ${skipped} już istniejących.`
            : `${added}.`;
        },
        {},
      );
      return;
    }

    const form = new FormData(event.currentTarget);
    submit(
      parseValues(unitSchema, {
        number: form.get("number"),
        floor: floorFrom(form.get("floor")),
      }),
      async (unit) => {
        await client.structure.units.create({
          communityId,
          staircaseId,
          ...unit,
        });
        return `Dodano lokal ${unit.number}.`;
      },
      unitTaken,
    );
  }

  function onUnitSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (dialog?.type !== "editUnit") return;
    const unitId = dialog.unit.id;
    const form = new FormData(event.currentTarget);
    submit(
      parseValues(unitSchema, {
        number: form.get("number"),
        floor: floorFrom(form.get("floor")),
      }),
      async (unit) => {
        await client.structure.units.update({ communityId, unitId, ...unit });
        return `Zapisano lokal ${unit.number}.`;
      },
      unitTaken,
    );
  }

  /** Name of a new common area at the chosen place, or a new name of an existing one. */
  function onLocationSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseValues(locationSchema, {
      name: new FormData(event.currentTarget).get("name"),
    });
    if (dialog?.type === "addLocation") {
      const { place } = dialog;
      submit(
        parsed,
        async ({ name }) => {
          await client.locations.create({
            communityId,
            name,
            ...(place.level === "community"
              ? {}
              : { buildingId: place.building.id }),
            ...(place.level === "staircase"
              ? { staircaseId: place.staircase.id }
              : {}),
          });
          return `Dodano część wspólną ${name}.`;
        },
        { name: locationTakenMessage(place) },
      );
    }
    if (dialog?.type === "editLocation") {
      const { location, place } = dialog;
      submit(
        parsed,
        async ({ name }) => {
          await client.locations.update({
            communityId,
            locationId: location.id,
            name,
          });
          return `Zapisano część wspólną ${name}.`;
        },
        { name: locationTakenMessage(place) },
      );
    }
  }

  /** Deletes what the open confirmation is about; a refusal gets its own window. */
  function confirmDelete() {
    if (!dialog) return;
    let title: string;
    let run: () => Promise<string>;

    if (dialog.type === "deleteBuilding") {
      const { id, name } = dialog.building;
      title = `Nie można usunąć budynku ${name}`;
      run = async () => {
        await client.structure.buildings.remove({
          communityId,
          buildingId: id,
        });
        return `Usunięto budynek ${name}.`;
      };
    } else if (dialog.type === "deleteStaircase") {
      const { id, name } = dialog.staircase;
      title = `Nie można usunąć klatki ${name}`;
      run = async () => {
        await client.structure.staircases.remove({
          communityId,
          staircaseId: id,
        });
        return `Usunięto klatkę ${name}.`;
      };
    } else if (dialog.type === "deleteUnit") {
      const { id, number } = dialog.unit;
      title = `Nie można usunąć lokalu ${number}`;
      run = async () => {
        await client.structure.units.remove({ communityId, unitId: id });
        return `Usunięto lokal ${number}.`;
      };
    } else if (dialog.type === "deleteLocation") {
      const { id, name } = dialog.location;
      title = `Nie można usunąć części wspólnej ${name}`;
      run = async () => {
        await client.locations.remove({ communityId, locationId: id });
        return `Usunięto część wspólną ${name}.`;
      };
    } else if (dialog.type === "removeMember") {
      const { userId, name } = dialog.member;
      title = "Nie można usunąć ostatniego administratora";
      run = async () => {
        await client.members.remove({ communityId, userId });
        return `Usunięto ze wspólnoty: ${name}`;
      };
    } else if (dialog.type === "removeUnitMember") {
      const { userId, name } = dialog.member;
      const { id, number } = dialog.unit;
      title = `Nie można usunąć osoby z lokalu ${number}`;
      run = async () => {
        await client.unitMembers.remove({ communityId, unitId: id, userId });
        return `Usunięto z lokalu ${number}: ${name}`;
      };
    } else {
      return;
    }

    // Removing yourself from the community takes away this admin view: back to the dashboard
    const leaves =
      dialog.type === "removeMember" && dialog.member.userId === viewerId;
    change.mutate(run, {
      onSuccess: () => {
        if (!leaves) return;
        router.push("/");
        router.refresh();
      },
      onError: (error) => showRefusal(error, title),
    });
  }

  /** Invitation to the community (admin, worker, contractor) or to the open unit. */
  function onInviteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (dialog?.type === "inviteToCommunity") {
      submit(
        parseValues(communityInvitationSchema, {
          email,
          role,
          companyName: optional(form.get("companyName")),
        }),
        async (invitation) => {
          const sent = await client.communityMembers.invite({
            communityId,
            ...invitation,
          });
          return `Wysłano zaproszenie na ${sent.email}`;
        },
        {},
      );
    }
    if (dialog?.type === "inviteToUnit") {
      const unitId = dialog.unit.id;
      submit(
        parseValues(unitInvitationSchema, { email, role }),
        async (invitation) => {
          const sent = await client.unitMembers.invite({
            communityId,
            unitId,
            ...invitation,
          });
          return `Wysłano zaproszenie na ${sent.email}`;
        },
        {},
      );
    }
  }

  /** New role of someone in the community or in a unit. */
  function onRoleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (dialog?.type === "changeRole") {
      const { userId, name } = dialog.member;
      submit(
        parseValues(updateCommunityMemberSchema, {
          role,
          companyName: optional(form.get("companyName")),
        }),
        async (update) => {
          await client.members.update({ communityId, userId, ...update });
          return `Zapisano nową rolę: ${name}`;
        },
        {},
        "Nie można zmienić roli ostatniego administratora",
        () => {
          // Giving up your own admin role takes away this view. A contractor may not see
          // the community at all (back to the dashboard); a worker gets the page reloaded
          // as a non-admin, with their own units.
          if (userId !== viewerId || role === "admin") return;
          if (role === "contractor") router.push("/");
          router.refresh();
        },
      );
    }
    if (dialog?.type === "changeUnitRole") {
      const { userId, name } = dialog.member;
      const unitId = dialog.unit.id;
      submit(
        parseValues(updateUnitMemberSchema, { role }),
        async (update) => {
          await client.unitMembers.update({
            communityId,
            unitId,
            userId,
            ...update,
          });
          return `Zapisano nową rolę: ${name}`;
        },
        {},
      );
    }
  }

  function toggleBuilding(buildingId: string) {
    setCollapsed((ids) =>
      ids.includes(buildingId)
        ? ids.filter((id) => id !== buildingId)
        : [...ids, buildingId],
    );
  }

  return {
    community,
    canManage: can("structure.manage"),
    canManageLocations: can("locations.manage"),
    canOpenSettings: can("community.update") || can("community.delete"),
    viewerId,
    tab,
    selectTab,
    members: {
      list: members,
      canList: canListMembers,
      canInviteToCommunity: can("communityMembers.invite"),
      canInviteToUnit: can("unitMembers.invite"),
      canManage: can("members.manage"),
    },
    unitMembers: {
      list: unitMembers.data,
      error: unitMembers.error?.message,
    },
    isCollapsed: (buildingId: string) => collapsed.includes(buildingId),
    toggleBuilding,
    dialog,
    open,
    close,
    errors,
    // A taken name is shown under its field, a refusal in its own window
    formError:
      change.error &&
      !hasCode(change.error, "CONFLICT") &&
      !isRefusal(change.error)
        ? change.error.message
        : undefined,
    isPending: change.isPending,
    onBuildingSubmit,
    onNameSubmit,
    onUnitsSubmit,
    onUnitSubmit,
    onLocationSubmit,
    confirmDelete,
    onInviteSubmit,
    onRoleSubmit,
    roleForm: { email, setEmail, role, setRole },
    buildingForm: {
      staircases,
      canAddStaircase: canAddStaircase(staircases),
      addStaircase: () => setStaircases(withNextStaircase(staircases)),
      removeStaircase: (name: string) =>
        setStaircases(staircases.filter((staircase) => staircase !== name)),
    },
    unitsForm: {
      mode: unitsMode,
      setMode: (mode: UnitsMode) => {
        setErrors({});
        setUnitsMode(mode);
      },
      from: seriesFrom,
      setFrom: setSeriesFrom,
      to: seriesTo,
      setTo: setSeriesTo,
    },
  };
}
