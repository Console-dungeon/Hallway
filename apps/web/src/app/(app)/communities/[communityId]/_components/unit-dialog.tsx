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
import { Separator } from "@/components/ui/separator";

interface UnitDialogProps {
  unit: UnitDetail;
  /** Where the unit is, e.g. "Lipowa 12 · Klatka A". */
  place: string;
  /** People of the unit, above the unit's own fields; only for those who may see them. */
  people?: React.ReactNode;
  errors: { number?: string | undefined; floor?: string | undefined };
  formError?: string | undefined;
  isPending: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onClose: () => void;
}

/** One unit: who is assigned to it, its number and floor, or go on to delete it. */
export function UnitDialog({
  unit,
  place,
  people,
  errors,
  formError,
  isPending,
  onSubmit,
  onDelete,
  onClose,
}: UnitDialogProps) {
  return (
    <FormDialog
      title={`Lokal ${unit.number}`}
      description={place}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="2xl:gap-6">
          {people && (
            <>
              {people}
              <Separator />
            </>
          )}
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
