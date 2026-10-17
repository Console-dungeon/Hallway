import type { UnitMember } from "@hallway/shared";
import { Pencil, Trash2, UserPlus } from "lucide-react";

import { FormAlert } from "@/components/form-alert";

import { ActionButton } from "./action-button";
import { PersonRow } from "./person-row";

interface UnitPeopleProps {
  /** Undefined while loading. */
  members: UnitMember[] | undefined;
  error?: string | undefined;
  viewerId: string;
  canInvite: boolean;
  /** Whether the viewer may change roles and remove people. */
  canManage: boolean;
  onInvite: () => void;
  onChangeRole: (member: UnitMember) => void;
  onRemove: (member: UnitMember) => void;
}

/** "Osoby w lokalu" in the unit window: owners and residents, and inviting more. */
export function UnitPeople({
  members,
  error,
  viewerId,
  canInvite,
  canManage,
  onInvite,
  onChangeRole,
  onRemove,
}: UnitPeopleProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p id="unit-people-label" className="text-base font-medium 2xl:text-lg">
          Osoby w lokalu
        </p>
        {canInvite && (
          <ActionButton
            icon={UserPlus}
            label="Zaproś do lokalu"
            showLabel
            onClick={onInvite}
          />
        )}
      </div>
      {error ? (
        <FormAlert>{error}</FormAlert>
      ) : members === undefined ? (
        <p className="text-sm text-muted-foreground 2xl:text-base">
          Wczytywanie…
        </p>
      ) : members.length === 0 ? (
        <p className="rounded-lg border bg-muted/40 px-3.5 py-3 text-sm text-muted-foreground 2xl:text-base">
          Nikt nie jest jeszcze przypisany do tego lokalu. Zaproś właściciela
          albo mieszkańca.
        </p>
      ) : (
        <ul
          aria-labelledby="unit-people-label"
          className="divide-y rounded-lg border"
        >
          {members.map((member) => (
            <PersonRow
              key={member.userId}
              compact
              person={member}
              isViewer={member.userId === viewerId}
              actions={
                canManage && (
                  <>
                    <ActionButton
                      icon={Pencil}
                      label={`Zmień rolę w lokalu – ${member.name}`}
                      onClick={() => onChangeRole(member)}
                    />
                    <ActionButton
                      icon={Trash2}
                      label={`Usuń z lokalu – ${member.name}`}
                      onClick={() => onRemove(member)}
                    />
                  </>
                )
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
