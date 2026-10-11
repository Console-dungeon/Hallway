import { FormAlert } from "@/components/form-alert";
import {
  dialogButtonClassName,
  DialogActions,
  FormDialog,
} from "@/components/form-dialog";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

interface NameDialogProps {
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  /** The current name when renaming. */
  defaultValue?: string;
  submitLabel: string;
  error?: string | undefined;
  formError?: string | undefined;
  isPending: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

/** Window with a single name field: a new staircase, or a new name for something. */
export function NameDialog({
  title,
  description,
  label,
  placeholder,
  defaultValue,
  submitLabel,
  error,
  formError,
  isPending,
  onSubmit,
  onClose,
}: NameDialogProps) {
  return (
    <FormDialog title={title} description={description} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="2xl:gap-6">
          {formError && <FormAlert>{formError}</FormAlert>}
          <TextField
            name="name"
            label={label}
            placeholder={placeholder}
            defaultValue={defaultValue}
            error={error}
            autoFocus
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
              {submitLabel}
            </Button>
          </DialogActions>
        </FieldGroup>
      </form>
    </FormDialog>
  );
}
