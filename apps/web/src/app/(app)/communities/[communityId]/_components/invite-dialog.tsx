import { INVITATION_VALID_DAYS, type InvitationRole } from "@hallway/shared";

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

interface InviteDialogProps {
  title: string;
  /** Where the invitation leads: the community, or the unit's place. */
  description: string;
  roles: readonly InvitationRole[];
  form: {
    email: string;
    setEmail: (email: string) => void;
    role: InvitationRole;
    setRole: (role: InvitationRole) => void;
  };
  errors: {
    email?: string | undefined;
    role?: string | undefined;
    companyName?: string | undefined;
  };
  formError?: string | undefined;
  isPending: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

/** E-mail an invitation link: to the community as a whole or to one unit. */
export function InviteDialog({
  title,
  description,
  roles,
  form,
  errors,
  formError,
  isPending,
  onSubmit,
  onClose,
}: InviteDialogProps) {
  const email = form.email.trim();

  return (
    <FormDialog title={title} description={description} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="2xl:gap-6">
          {formError && <FormAlert>{formError}</FormAlert>}
          <TextField
            name="email"
            label="E-mail"
            type="email"
            autoComplete="off"
            placeholder="jan@example.com"
            value={form.email}
            onChange={(event) => form.setEmail(event.target.value)}
            error={errors.email}
            autoFocus
          />
          <RolePicker
            roles={roles}
            value={form.role}
            onChange={form.setRole}
            error={errors.role}
          />
          {form.role === "contractor" && (
            <TextField
              name="companyName"
              label="Nazwa firmy"
              placeholder="np. HydroSerwis sp. z o.o."
              error={errors.companyName}
            />
          )}
          <div className="rounded-lg border bg-muted/40 px-3.5 py-3">
            <p className="font-medium 2xl:text-lg">
              Wyślemy e-mail z linkiem ważnym {INVITATION_VALID_DAYS} dni
            </p>
            <p className="text-sm break-words text-muted-foreground 2xl:text-base">
              {email
                ? `Zaproszenie przyjmie tylko konto z adresem ${email}.`
                : "Zaproszenie przyjmie tylko konto z tym adresem e-mail."}
            </p>
          </div>
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
              {isPending ? "Wysyłanie…" : "Wyślij zaproszenie"}
            </Button>
          </DialogActions>
        </FieldGroup>
      </form>
    </FormDialog>
  );
}
