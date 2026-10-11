import type { FirstBuildingInput } from "@hallway/shared";
import { Plus, X } from "lucide-react";

import { FormCard } from "@/components/form-card";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
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

const chipClassName =
  "inline-flex h-10 items-center rounded-lg border text-base font-medium 2xl:h-12 2xl:text-lg";

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
          <div className="flex flex-col gap-2">
            <p
              id="staircases-label"
              className="text-base font-medium 2xl:text-lg"
            >
              Klatki schodowe
            </p>
            <ul
              aria-labelledby="staircases-label"
              className="flex flex-wrap gap-2"
            >
              {form.staircases.map((name) => (
                <li
                  key={name}
                  className={`${chipClassName} gap-1 bg-card pl-3 ${form.canRemoveStaircase ? "pr-1" : "pr-3"}`}
                >
                  Klatka {name}
                  {form.canRemoveStaircase && (
                    <button
                      type="button"
                      aria-label={`Usuń klatkę ${name}`}
                      onClick={() => form.removeStaircase(name)}
                      className="flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </li>
              ))}
              {form.canAddStaircase && (
                <li>
                  <button
                    type="button"
                    onClick={form.addStaircase}
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
            {errors.staircases && <FieldError>{errors.staircases}</FieldError>}
          </div>
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
