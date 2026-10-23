import { FormAlert } from "@/components/form-alert";
import {
  dialogButtonClassName,
  DialogActions,
  FormDialog,
} from "@/components/form-dialog";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

interface DeleteCommunityDialogProps {
  name: string;
  confirmation: string;
  setConfirmation: (value: string) => void;
  /** True once the typed name matches the community's name exactly. */
  canConfirm: boolean;
  formError?: string | undefined;
  onConfirm: () => void;
  onClose: () => void;
}

/** Question before a community is deleted; the name has to be typed to confirm. */
export function DeleteCommunityDialog({
  name,
  confirmation,
  setConfirmation,
  canConfirm,
  formError,
  onConfirm,
  onClose,
}: DeleteCommunityDialogProps) {
  return (
    <FormDialog
      title="Usunąć wspólnotę?"
      description={`${name} zniknie dla wszystkich członków – administratorów, pracowników, wykonawców, właścicieli i mieszkańców. Dane nie zostaną skasowane, ale nikt nie będzie miał już do nich dostępu.`}
      onClose={onClose}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (canConfirm) onConfirm();
        }}
      >
        <FieldGroup className="2xl:gap-6">
          {formError && <FormAlert>{formError}</FormAlert>}
          <TextField
            name="confirmation"
            label="Wpisz nazwę wspólnoty, aby potwierdzić"
            placeholder={name}
            autoComplete="off"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
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
              variant="destructive"
              className={dialogButtonClassName}
              disabled={!canConfirm}
            >
              Usuń wspólnotę
            </Button>
          </DialogActions>
        </FieldGroup>
      </form>
    </FormDialog>
  );
}
