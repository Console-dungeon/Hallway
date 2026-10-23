import type { LocationSummary } from "@hallway/shared";

import { FormAlert } from "@/components/form-alert";
import {
  dialogButtonClassName,
  DialogActions,
  FormDialog,
} from "@/components/form-dialog";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

interface LocationDialogProps {
  location: LocationSummary;
  /** Where the common area is, e.g. "Lipowa 12 · Klatka A". */
  place: string;
  error?: string | undefined;
  formError?: string | undefined;
  isPending: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onClose: () => void;
}

/** One common area: rename it, or go on to delete it. */
export function LocationDialog({
  location,
  place,
  error,
  formError,
  isPending,
  onSubmit,
  onDelete,
  onClose,
}: LocationDialogProps) {
  return (
    <FormDialog
      title={location.name}
      description={`Część wspólna · ${place}`}
      onClose={onClose}
    >
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="2xl:gap-6">
          {formError && <FormAlert>{formError}</FormAlert>}
          <TextField
            name="name"
            label="Nazwa"
            defaultValue={location.name}
            error={error}
            autoFocus
          />
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              className={dialogButtonClassName}
              onClick={onDelete}
            >
              Usuń część wspólną
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
