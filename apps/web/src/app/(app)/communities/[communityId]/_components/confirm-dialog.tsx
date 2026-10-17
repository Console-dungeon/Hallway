import { FormAlert } from "@/components/form-alert";
import {
  dialogButtonClassName,
  DialogActions,
  FormDialog,
} from "@/components/form-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  title: string;
  description: string;
  /** Without it the window only informs and has a single "Rozumiem" button. */
  confirm?: { label: string; onConfirm: () => void };
  formError?: string | undefined;
  isPending?: boolean;
  onClose: () => void;
}

/** Question before something is deleted for good, or a notice that it cannot be. */
export function ConfirmDialog({
  title,
  description,
  confirm,
  formError,
  isPending = false,
  onClose,
}: ConfirmDialogProps) {
  return (
    <FormDialog title={title} description={description} onClose={onClose}>
      {formError && <FormAlert>{formError}</FormAlert>}
      <DialogActions>
        {confirm ? (
          <>
            <Button
              type="button"
              variant="outline"
              className={dialogButtonClassName}
              onClick={onClose}
            >
              Anuluj
            </Button>
            <Button
              type="button"
              variant="destructive"
              className={dialogButtonClassName}
              disabled={isPending}
              onClick={confirm.onConfirm}
            >
              {confirm.label}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            className={dialogButtonClassName}
            onClick={onClose}
          >
            Rozumiem
          </Button>
        )}
      </DialogActions>
    </FormDialog>
  );
}
