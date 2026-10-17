import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ActionButtonProps {
  icon: LucideIcon;
  /** What the button does; read by screen readers even when only the icon is shown. */
  label: string;
  /** Show the label next to the icon (from tablet width up). */
  showLabel?: boolean;
  onClick: () => void;
}

/** Small outline button of a building or staircase row. */
export function ActionButton({
  icon: Icon,
  label,
  showLabel = false,
  onClick,
}: ActionButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-label={label}
      onClick={onClick}
      className={
        showLabel
          ? "h-10 min-w-10 gap-1.5 px-2.5 text-sm sm:px-3.5 2xl:h-11 2xl:text-base"
          : "size-10 2xl:size-11"
      }
    >
      <Icon className="size-4 2xl:size-5" />
      {showLabel && <span className="hidden sm:inline">{label}</span>}
    </Button>
  );
}
