import { invitationRoleLabels, type InvitationRole } from "@hallway/shared";

import { SegmentedControl } from "@/components/segmented-control";
import { FieldError } from "@/components/ui/field";

/** What each role means, under the picker. */
const roleDescriptions: Record<InvitationRole, string> = {
  admin: "Zarządza wspólnotą: budynkami i lokalami, członkami i zaproszeniami.",
  worker: "Widzi wszystkie zgłoszenia wspólnoty i realizuje przypisane.",
  contractor:
    "Firma zewnętrzna. Widzi i realizuje tylko zgłoszenia przypisane do niej.",
  owner: "Właściciel i mieszkaniec mają w Hallway te same uprawnienia.",
  resident: "Właściciel i mieszkaniec mają w Hallway te same uprawnienia.",
};

interface RolePickerProps {
  /** The roles to choose from, in order. */
  roles: readonly InvitationRole[];
  value: InvitationRole;
  onChange: (role: InvitationRole) => void;
  error?: string | undefined;
}

/** "Rola": one of a few roles side by side, with what the chosen one may do. */
export function RolePicker({ roles, value, onChange, error }: RolePickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-base font-medium 2xl:text-lg">Rola</p>
      <SegmentedControl
        kind="radio"
        label="Rola"
        options={roles.map((role) => ({
          value: role,
          label: invitationRoleLabels[role],
        }))}
        value={value}
        onChange={onChange}
        fill
      />
      <p className="text-sm text-muted-foreground 2xl:text-base">
        {roleDescriptions[value]}
      </p>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
