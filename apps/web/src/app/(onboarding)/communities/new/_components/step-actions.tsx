import { cn } from "cn";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";

/** Size shared by every button of the wizard. */
export const stepButtonClassName =
  "h-12 px-6 text-base 2xl:h-14 2xl:px-8 2xl:text-lg";

interface StepActionsProps {
  /** A link leaves the wizard, a function goes one step back. */
  back: string | (() => void);
  /** A less prominent way forward (e.g. skipping the step); drops below on phones. */
  secondary?: React.ReactNode;
  /** What moves the visitor forward, on the right. */
  children: React.ReactNode;
}

/** Bottom row of a wizard step: "Wstecz" on the left, the way forward on the right. */
export function StepActions({ back, secondary, children }: StepActionsProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        {typeof back === "string" ? (
          <Link
            href={back}
            className={cn(
              buttonVariants({ variant: "outline" }),
              stepButtonClassName,
            )}
          >
            Wstecz
          </Link>
        ) : (
          <Button
            type="button"
            variant="outline"
            className={stepButtonClassName}
            onClick={back}
          >
            Wstecz
          </Button>
        )}
        <div className="flex items-center gap-4">
          {secondary && <div className="hidden sm:block">{secondary}</div>}
          {children}
        </div>
      </div>
      {secondary && (
        <div className="flex justify-center sm:hidden">{secondary}</div>
      )}
    </div>
  );
}
