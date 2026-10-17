import type { CommunityMember } from "@hallway/shared";
import { Pencil, Trash2 } from "lucide-react";

import { ActionButton } from "./action-button";
import { PersonRow } from "./person-row";

interface MembersCardProps {
  /** Undefined while loading. */
  members: CommunityMember[] | undefined;
  viewerId: string;
  /** Whether the viewer may change roles and remove people. */
  canManage: boolean;
  onChangeRole: (member: CommunityMember) => void;
  onRemove: (member: CommunityMember) => void;
}

/** Admins, workers and contractors of the community (the Members tab). */
export function MembersCard({
  members,
  viewerId,
  canManage,
  onChangeRole,
  onRemove,
}: MembersCardProps) {
  return (
    <section
      aria-label="Członkowie wspólnoty"
      className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
    >
      {members === undefined ? (
        <p className="px-4 py-4 text-base text-muted-foreground sm:px-6 2xl:text-lg">
          Wczytywanie…
        </p>
      ) : (
        <ul className="divide-y">
          {members.map((member) => (
            <PersonRow
              key={member.userId}
              person={member}
              isViewer={member.userId === viewerId}
              actions={
                canManage && (
                  <>
                    <ActionButton
                      icon={Pencil}
                      label={`Zmień rolę – ${member.name}`}
                      onClick={() => onChangeRole(member)}
                    />
                    <ActionButton
                      icon={Trash2}
                      label={`Usuń ze wspólnoty – ${member.name}`}
                      onClick={() => onRemove(member)}
                    />
                  </>
                )
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}
