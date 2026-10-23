import { cn } from "cn";
import { type LucideIcon, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  /** "tile" when both sides of a staircase are empty, "row" otherwise. */
  layout: "tile" | "row";
  icon: LucideIcon;
  title: string;
  hint: string;
  /** The button that fills the gap; left out for viewers who can't change anything. */
  action?: { label: string; onClick: () => void };
  className?: string;
}

/** A dashed placeholder where units or common areas would be, with a hint and an optional button. */
export function EmptyState({
  layout,
  icon: Icon,
  title,
  hint,
  action,
  className,
}: EmptyStateProps) {
  const button = action && (
    <Button
      type="button"
      variant="outline"
      onClick={action.onClick}
      className={cn(
        "h-10 cursor-pointer gap-1.5 px-3.5 text-sm 2xl:h-11 2xl:text-base",
        layout === "row" && "self-start sm:self-auto",
      )}
    >
      <Plus className="size-4 2xl:size-5" />
      {action.label}
    </Button>
  );

  if (layout === "tile") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/40 px-6 py-6 text-center sm:py-8",
          className,
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-xl border bg-card 2xl:size-12">
          <Icon className="size-5 text-muted-foreground 2xl:size-6" />
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-base font-medium 2xl:text-lg">{title}</span>
          <span className="text-sm text-muted-foreground 2xl:text-base">
            {hint}
          </span>
        </span>
        {button}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-dashed bg-muted/40 px-4 py-3 sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card 2xl:size-10">
          <Icon className="size-4 text-muted-foreground 2xl:size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium 2xl:text-base">{title}</span>
          <span className="text-sm text-muted-foreground 2xl:text-base">
            {hint}
          </span>
        </span>
      </div>
      {button}
    </div>
  );
}
