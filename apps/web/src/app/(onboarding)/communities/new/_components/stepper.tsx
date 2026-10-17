import { cn } from "cn";
import { Check } from "lucide-react";

const STEPS = ["Wspólnota", "Pierwszy budynek", "Podsumowanie"];

/** Where the visitor is in the founding wizard; `current` counts from 0. */
export function Stepper({ current }: { current: number }) {
  return (
    <ol
      aria-label="Kroki zakładania wspólnoty"
      className="flex items-center justify-center gap-2 text-base whitespace-nowrap sm:gap-3 2xl:text-lg"
    >
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className="flex items-center gap-2 sm:gap-3"
          >
            {index > 0 && (
              <span
                className={cn(
                  "h-px w-5 sm:w-8",
                  done || active ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium 2xl:size-9 2xl:text-base",
                done || active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground",
              )}
            >
              {done ? <Check className="size-4" /> : index + 1}
            </span>
            <span
              className={cn(
                "font-medium",
                !active && "hidden sm:inline",
                !done && !active && "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
