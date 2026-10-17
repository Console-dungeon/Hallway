import {
  type BuildingDetail,
  buildingNameFormSchema,
  buildingSchema,
  type CommunityDetail,
  type StaircaseDetail,
  staircaseSchema,
  type UnitDetail,
  unitSchema,
  unitSeriesSchema,
} from "@hallway/shared";
import { ORPCError } from "@orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { type FieldErrors, parseValues } from "@/lib/form";
import { client, orpc } from "@/lib/orpc";
import { LOKAL, plural } from "@/lib/plural";
import { canAddStaircase, withNextStaircase } from "@/lib/staircases";

/** The window currently open over the page, with what it is about. */
export type StructureDialog =
  | { type: "addBuilding" }
  | { type: "renameBuilding"; building: BuildingDetail }
  | { type: "deleteBuilding"; building: BuildingDetail }
  | { type: "addStaircase"; building: BuildingDetail }
  | { type: "renameStaircase"; staircase: StaircaseDetail }
  | { type: "deleteStaircase"; staircase: StaircaseDetail }
  | { type: "addUnits"; building: BuildingDetail; staircase: StaircaseDetail }
  | { type: "editUnit"; unit: UnitDetail }
  | { type: "deleteUnit"; unit: UnitDetail }
  | { type: "refused"; title: string; message: string };

export type UnitsMode = "series" | "single";

type Errors = FieldErrors<{
  name: string;
  staircases: string;
  number: string;
  floor: string;
  from: string;
  to: string;
}>;

function hasCode(error: unknown, code: string) {
  return error instanceof ORPCError && error.code === code;
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

export function useController(initial: CommunityDetail) {
  const communityId = initial.id;
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<StructureDialog | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [staircases, setStaircases] = useState(["A"]);
  const [unitsMode, setUnitsMode] = useState<UnitsMode>("series");
  const [seriesFrom, setSeriesFrom] = useState("");
  const [seriesTo, setSeriesTo] = useState("");

  const community = useQuery(
    orpc.communities.get.queryOptions({
      input: { communityId },
      initialData: initial,
    }),
  ).data;

  /**
   * Every change of the structure goes through here: it runs, the page reloads its data,
   * the window closes and the returned sentence is shown as a toast.
   */
  const change = useMutation({
    mutationFn: (run: () => Promise<string>) => run(),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({
        queryKey: orpc.communities.get.key({ input: { communityId } }),
      });
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
    setDialog(next);
  }

  function close() {
    setDialog(null);
  }

  /**
   * Shows field errors, or runs the change with the validated data. A name or number
   * that is already taken comes back from the API and lands under its field.
   */
  function submit<T>(
    parsed: { data?: T | undefined; errors?: Errors | undefined },
    run: (data: T) => Promise<string>,
    taken: Errors,
  ) {
    setErrors(parsed.errors ?? {});
    const { data } = parsed;
    if (data === undefined) return;
    change.mutate(() => run(data), {
      onError: (error) => {
        if (hasCode(error, "CONFLICT")) setErrors(taken);
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
    } else {
      return;
    }

    change.mutate(run, {
      onError: (error) => {
        if (hasCode(error, "UNIT_HAS_MEMBERS")) {
          setDialog({ type: "refused", title, message: error.message });
        }
      },
    });
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
    canManage: community.actions.includes("structure.manage"),
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
      !hasCode(change.error, "UNIT_HAS_MEMBERS")
        ? change.error.message
        : undefined,
    isPending: change.isPending,
    onBuildingSubmit,
    onNameSubmit,
    onUnitsSubmit,
    onUnitSubmit,
    confirmDelete,
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
