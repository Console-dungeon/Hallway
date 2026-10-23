import type { InvitationRole } from "@hallway/shared";

import { FormAlert } from "@/components/form-alert";
import {
  dialogButtonClassName,
  DialogActions,
  FormDialog,
} from "@/components/form-dialog";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

import { RolePicker } from "./role-picker";

interface RoleDialogProps {
  title: string;
  /** Who it is about, e.g. "Marek Nowicki · marek@example.com". */
  description: string;
  roles: readonly InvitationRole[];
  role: InvitationRole;
  setRole: (role: InvitationRole) => void;
  /** The current company of a contractor, filled in when the role is contractor. */
  companyName?: string | null | undefined;
  errors: { role?: string | undefined; companyName?: string | undefined };
  formError?: string | undefined;
  isPending: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

/** Someone's role in the community or in a unit. */
export function RoleDialog({
  title,
  description,
  roles,
  role,
  setRole,
  companyName,
  errors,
  formError,
  isPending,
  onSubmit,
  onClose,
}: RoleDialogProps) {
  return (
    <FormDialog title={title} description={description} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="2xl:gap-6">
          {formError && <FormAlert>{formError}</FormAlert>}
          <RolePicker
            roles={roles}
            value={role}
            onChange={setRole}
            error={errors.role}
          />
          {role === "contractor" && (
            <TextField
              name="companyName"
              label="Nazwa firmy"
              placeholder="np. HydroSerwis sp. z o.o."
              defaultValue={companyName ?? ""}
              error={errors.companyName}
            />
          )}
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
        </FieldGroup>
      </form>
    </FormDialog>
  );
}
