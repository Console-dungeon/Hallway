import {
  type CommunityDetailsInput,
  communityDetailsSchema,
  type CommunitySummary,
  type FirstBuildingInput,
  firstBuildingSchema,
  STAIRCASES_MAX,
} from "@hallway/shared";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { type FieldErrors, parseForm, parseValues } from "@/lib/form";
import { orpc } from "@/lib/orpc";

export type WizardStep = "details" | "building" | "summary" | "created";

/** Staircases are named with consecutive letters, so adding one takes a single click. */
const STAIRCASE_NAMES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  .slice(0, STAIRCASES_MAX)
  .split("");

export function useController() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("details");
  const [details, setDetails] = useState<CommunityDetailsInput>({
    name: "",
    address: "",
  });
  const [buildingName, setBuildingName] = useState("");
  const [staircases, setStaircases] = useState(["A"]);
  /** The building as accepted on step 2; null when the step was skipped. */
  const [building, setBuilding] = useState<FirstBuildingInput | null>(null);
  const [detailsErrors, setDetailsErrors] = useState<
    FieldErrors<CommunityDetailsInput>
  >({});
  const [buildingErrors, setBuildingErrors] = useState<
    FieldErrors<FirstBuildingInput>
  >({});
  const [created, setCreated] = useState<CommunitySummary | null>(null);

  const create = useMutation(
    orpc.communities.create.mutationOptions({
      onSuccess: (community) => {
        setCreated(community);
        setStep("created");
      },
    }),
  );

  function onDetailsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, errors } = parseForm(
      communityDetailsSchema,
      event.currentTarget,
    );
    setDetailsErrors(errors ?? {});
    if (!data) return;
    setDetails(data);
    setStep("building");
  }

  function onBuildingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, errors } = parseValues(firstBuildingSchema, {
      name: buildingName,
      staircases,
    });
    setBuildingErrors(errors ?? {});
    if (!data) return;
    setBuilding(data);
    setStep("summary");
  }

  function skipBuilding() {
    setBuilding(null);
    setBuildingErrors({});
    setStep("summary");
  }

  function addStaircase() {
    const next = STAIRCASE_NAMES.find((name) => !staircases.includes(name));
    if (next) setStaircases([...staircases, next].sort());
  }

  function removeStaircase(name: string) {
    setStaircases(staircases.filter((staircase) => staircase !== name));
  }

  function back() {
    if (step === "building") setStep("details");
    if (step === "summary") setStep("building");
  }

  function onSubmit() {
    create.mutate({ ...details, ...(building && { building }) });
  }

  function openCommunity() {
    router.push("/");
    router.refresh();
  }

  return {
    step,
    details,
    building,
    created,
    errors: { details: detailsErrors, building: buildingErrors },
    formError: create.error?.message,
    isPending: create.isPending,
    onSubmit,
    onDetailsSubmit,
    onBuildingSubmit,
    skipBuilding,
    back,
    openCommunity,
    buildingForm: {
      name: buildingName,
      setName: setBuildingName,
      staircases,
      canAddStaircase: staircases.length < STAIRCASES_MAX,
      canRemoveStaircase: staircases.length > 1,
      addStaircase,
      removeStaircase,
    },
  };
}
