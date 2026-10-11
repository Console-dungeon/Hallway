import type {
  CommunityDetailsInput,
  FirstBuildingInput,
} from "@hallway/shared";

import { FormAlert } from "@/components/form-alert";
import { FormCard } from "@/components/form-card";
import { Button } from "@/components/ui/button";

import { StepActions, stepButtonClassName } from "./step-actions";

interface SummaryStepProps {
  details: CommunityDetailsInput;
  /** null when the building step was skipped. */
  building: FirstBuildingInput | null;
  formError?: string | undefined;
  isPending: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

export function SummaryStep({
  details,
  building,
  formError,
  isPending,
  onSubmit,
  onBack,
}: SummaryStepProps) {
  const rows = [
    ["Wspólnota", details.name],
    ["Adres", details.address],
    ...(building
      ? [
          ["Budynek", building.name],
          ["Klatki schodowe", building.staircases.join(", ")],
        ]
      : [["Budynek", "dodasz później"]]),
    ["Twoja rola", "Administrator"],
  ];

  return (
    <FormCard
      title="Wszystko się zgadza?"
      description="Sprawdź dane. Po założeniu wspólnoty zostaniesz jej administratorem."
    >
      <div className="flex flex-col gap-5 2xl:gap-6">
        {formError && <FormAlert>{formError}</FormAlert>}
        <dl className="divide-y rounded-lg border bg-muted/40 px-4 text-base 2xl:text-lg">
          {rows.map(([term, value]) => (
            <div
              key={term}
              className="flex items-baseline justify-between gap-6 py-3"
            >
              <dt className="shrink-0 text-muted-foreground">{term}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <StepActions back={onBack}>
          <Button
            type="button"
            className={stepButtonClassName}
            disabled={isPending}
            onClick={onSubmit}
          >
            {isPending ? "Zakładanie…" : "Załóż wspólnotę"}
          </Button>
        </StepActions>
      </div>
    </FormCard>
  );
}
