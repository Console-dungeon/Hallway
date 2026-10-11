import type { CommunityDetailsInput } from "@hallway/shared";

import { FormCard } from "@/components/form-card";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import type { FieldErrors } from "@/lib/form";

import { StepActions, stepButtonClassName } from "./step-actions";

interface DetailsStepProps {
  /** What was entered before, when the visitor comes back to this step. */
  details: CommunityDetailsInput;
  errors: FieldErrors<CommunityDetailsInput>;
  exitHref: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function DetailsStep({
  details,
  errors,
  exitHref,
  onSubmit,
}: DetailsStepProps) {
  return (
    <FormCard
      title="Jak nazywa się Twoja wspólnota?"
      description="Nazwę i adres zobaczą mieszkańcy. Zmienisz je później w ustawieniach."
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="2xl:gap-6">
          <TextField
            name="name"
            label="Nazwa wspólnoty"
            placeholder="np. Wspólnota Mieszkaniowa Lipowa 12"
            defaultValue={details.name}
            error={errors.name}
            autoFocus
          />
          <TextField
            name="address"
            label="Adres"
            autoComplete="street-address"
            placeholder="np. ul. Lipowa 12, 30-001 Kraków"
            defaultValue={details.address}
            error={errors.address}
          />
          <StepActions back={exitHref}>
            <Button type="submit" className={stepButtonClassName}>
              Dalej
            </Button>
          </StepActions>
        </FieldGroup>
      </form>
    </FormCard>
  );
}
