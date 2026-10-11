import { FormAlert } from "@/components/form-alert";
import {
  dialogButtonClassName,
  DialogActions,
  FormDialog,
} from "@/components/form-dialog";
import { StaircaseChips } from "@/components/staircase-chips";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

interface BuildingDialogProps {
  form: {
    staircases: string[];
    canAddStaircase: boolean;
    addStaircase: () => void;
    removeStaircase: (name: string) => void;
  };
  errors: { name?: string | undefined; staircases?: string | undefined };
  formError?: string | undefined;
  isPending: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export function BuildingDialog({
  form,
  errors,
  formError,
  isPending,
  onSubmit,
  onClose,
}: BuildingDialogProps) {
  return (
    <FormDialog
      title="Dodaj budynek"
      description="Klatki dodasz teraz albo później."
      onClose={onClose}
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="2xl:gap-6">
          {formError && <FormAlert>{formError}</FormAlert>}
          <TextField
            name="name"
            label="Nazwa budynku"
            placeholder="np. Lipowa 12 albo Budynek A"
            error={errors.name}
            autoFocus
          />
          <StaircaseChips
            staircases={form.staircases}
            canAdd={form.canAddStaircase}
            canRemove
            onAdd={form.addStaircase}
            onRemove={form.removeStaircase}
            error={errors.staircases}
          />
          <DialogActions>
            <Button
              type="button"
              variant="outline"
              className={dialogButtonClassName}
              onClick={onClose}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              className={dialogButtonClassName}
              disabled={isPending}
            >
              Dodaj budynek
            </Button>
          </DialogActions>
        </FieldGroup>
      </form>
    </FormDialog>
  );
}
