import { invitationRoleLabels, type InvitationRole } from "@hallway/shared";
import { cn } from "cn";

interface PersonRowProps {
  person: {
    name: string;
    email: string;
    role: InvitationRole;
    companyName?: string | null;
  };
  /** The signed-in user; marked "(Ty)". */
  isViewer: boolean;
  /** Edit and remove buttons, if the viewer may use them. */
  actions?: React.ReactNode;
  /** Smaller rows inside a dialog. */
  compact?: boolean;
}

/**
 * One person in a list: name and e-mail, the role (with the company for contractors) and
 * optional actions. On phones the role goes under the e-mail.
 */
export function PersonRow({
  person,
  isViewer,
  actions,
  compact = false,
}: PersonRowProps) {
  return (
    <li
      aria-label={person.name}
      className={cn(
        "flex items-center gap-3 sm:gap-4",
        compact ? "px-3 py-2.5 sm:px-4" : "px-4 py-4 sm:px-6",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 sm:flex-1">
          <p className="flex items-baseline gap-1.5">
            <span className="truncate text-base font-medium 2xl:text-lg">
              {person.name}
            </span>
            {isViewer && (
              <span className="shrink-0 text-sm text-muted-foreground 2xl:text-base">
                (Ty)
              </span>
            )}
          </p>
          <p className="truncate text-sm text-muted-foreground 2xl:text-base">
            {person.email}
          </p>
        </div>
        <div
          className={cn(
            "min-w-0",
            // A fixed column lines the roles up when actions follow; without them they sit on the right
            actions && !compact ? "sm:w-60" : "sm:text-right",
          )}
        >
          <p
            className={cn(
              compact ? "text-sm 2xl:text-base" : "text-base 2xl:text-lg",
            )}
          >
            {invitationRoleLabels[person.role]}
          </p>
          {person.companyName && (
            <p className="truncate text-sm text-muted-foreground 2xl:text-base">
              {person.companyName}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </li>
  );
}
