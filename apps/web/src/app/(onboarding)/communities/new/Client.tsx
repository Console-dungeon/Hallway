"use client";

import { BuildingStep } from "./_components/building-step";
import { Created } from "./_components/created";
import { DetailsStep } from "./_components/details-step";
import { Stepper } from "./_components/stepper";
import { SummaryStep } from "./_components/summary-step";
import { useController } from "./useController";

interface ClientProps {
  /** Where "Wstecz" on the first step leads. */
  exitHref: string;
}

const STEP_INDEX = { details: 0, building: 1, summary: 2 };

export function Client({ exitHref }: ClientProps) {
  const {
    step,
    details,
    building,
    created,
    errors,
    formError,
    isPending,
    onSubmit,
    onDetailsSubmit,
    onBuildingSubmit,
    skipBuilding,
    back,
    openCommunity,
    buildingForm,
  } = useController();

  if (step === "created") {
    return (
      <Created name={created?.name ?? details.name} onOpen={openCommunity} />
    );
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-8 2xl:max-w-2xl 2xl:gap-10">
      <Stepper current={STEP_INDEX[step]} />
      {step === "details" && (
        <DetailsStep
          details={details}
          errors={errors.details}
          exitHref={exitHref}
          onSubmit={onDetailsSubmit}
        />
      )}
      {step === "building" && (
        <BuildingStep
          form={buildingForm}
          errors={errors.building}
          onSubmit={onBuildingSubmit}
          onSkip={skipBuilding}
          onBack={back}
        />
      )}
      {step === "summary" && (
        <SummaryStep
          details={details}
          building={building}
          formError={formError}
          isPending={isPending}
          onSubmit={onSubmit}
          onBack={back}
        />
      )}
    </div>
  );
}
