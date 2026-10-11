import type { UnitDetail } from "@hallway/shared";

import { FormAlert } from "@/components/form-alert";
import {
  dialogButtonClassName,
  DialogActions,
  FormDialog,
} from "@/components/form-dialog";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

interface UnitDialogProps {
  unit: UnitDetail;
  errors: { number?: string | undefined; floor?: string | undefined };
  formError?: string | undefined;
  isPending: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onClose: () => void;
}

/** One unit: change its number or floor, or go on to delete it. */
export function UnitDialog({
  unit,
  errors,
  formError,
  isPending,
  onSubmit,
  onDelete,
  onClose,
}: UnitDialogProps) {
  return (
    <FormDialog title={`Lokal ${unit.number}`} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="2xl:gap-6">
          {formError && <FormAlert>{formError}</FormAlert>}
          <div className="grid grid-cols-2 gap-4">
            <TextField
              name="number"
              label="Numer lokalu"
              defaultValue={unit.number}
              error={errors.number}
            />
            <TextField
              name="floor"
              label="Piętro (opcjonalnie)"
              inputMode="numeric"
              placeholder="np. 3"
              defaultValue={unit.floor ?? ""}
              error={errors.floor}
            />
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              className={dialogButtonClassName}
              onClick={onDelete}
            >
              Usuń lokal
            </Button>
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
                Zapisz
              </Button>
            </DialogActions>
          </div>
        </FieldGroup>
      </form>
    </FormDialog>
  );
}
