import type { FirstBuildingInput } from "@hallway/shared";
import { FormCard } from "@/components/form-card";
import { StaircaseChips } from "@/components/staircase-chips";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import type { FieldErrors } from "@/lib/form";

import { StepActions, stepButtonClassName } from "./step-actions";

interface BuildingStepProps {
  form: {
    name: string;
    setName: (name: string) => void;
    staircases: string[];
    canAddStaircase: boolean;
    canRemoveStaircase: boolean;
    addStaircase: () => void;
    removeStaircase: (name: string) => void;
  };
  errors: FieldErrors<FirstBuildingInput>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function BuildingStep({
  form,
  errors,
  onSubmit,
  onSkip,
  onBack,
}: BuildingStepProps) {
  return (
    <FormCard
      title="Dodaj pierwszy budynek"
      description="Kolejne budynki, lokale i części wspólne dodasz po założeniu wspólnoty."
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="2xl:gap-6">
          <TextField
            name="buildingName"
            label="Nazwa budynku"
            placeholder="np. Lipowa 12 albo Budynek A"
            value={form.name}
            onChange={(event) => form.setName(event.target.value)}
            error={errors.name}
            autoFocus
          />
          <StaircaseChips
            staircases={form.staircases}
            canAdd={form.canAddStaircase}
            canRemove={form.canRemoveStaircase}
            onAdd={form.addStaircase}
            onRemove={form.removeStaircase}
            error={errors.staircases}
          />
          <StepActions
            back={onBack}
            secondary={
              <Button
                type="button"
                variant="ghost"
                className={`${stepButtonClassName} px-3 text-muted-foreground 2xl:px-4`}
                onClick={onSkip}
              >
                Pomiń ten krok
              </Button>
            }
          >
            <Button type="submit" className={stepButtonClassName}>
              Dalej
            </Button>
          </StepActions>
        </FieldGroup>
      </form>
    </FormCard>
  );
}
