import { cn } from "cn";

interface SegmentedControlProps<T extends string> {
  /** Name read by screen readers, e.g. "Rola". */
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /**
   * "tabs" switches what is shown below (role tab), "radio" picks a value of a form
   * (role radio).
   */
  kind: "tabs" | "radio";
  /**
   * Stretch over the whole width with equal segments (forms); otherwise only on phones,
   * and as wide as the labels from tablets up.
   */
  fill?: boolean;
  className?: string;
}

/** Row of mutually exclusive options in a frame; the chosen one looks like a raised card. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  kind,
  fill = false,
  className,
}: SegmentedControlProps<T>) {
  const isTabs = kind === "tabs";
  return (
    <div
      role={isTabs ? "tablist" : "radiogroup"}
      aria-label={label}
      className={cn(
        "gap-1 rounded-lg border bg-muted/40 p-1",
        "grid auto-cols-fr grid-flow-col",
        !fill && "sm:inline-flex sm:self-start",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role={isTabs ? "tab" : "radio"}
            aria-selected={isTabs ? selected : undefined}
            aria-checked={isTabs ? undefined : selected}
            data-selected={selected ? true : undefined}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-10 min-w-0 cursor-pointer rounded-md font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring data-selected:bg-card data-selected:text-foreground data-selected:ring-1 data-selected:ring-foreground/10 2xl:h-12 2xl:text-lg",
              fill ? "px-1 sm:px-2" : "px-5",
              // Three labels side by side only fit a phone-wide dialog in the smaller size
              options.length > 2 ? "text-sm sm:text-base" : "text-base",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
