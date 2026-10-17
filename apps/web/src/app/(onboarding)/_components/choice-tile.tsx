import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

interface ChoiceTileProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Text of the call to action at the bottom of the tile. */
  action: string;
  /** Where the tile leads; without it the tile is a button calling `onClick`. */
  href?: string;
  onClick?: () => void;
}

const tileClassName =
  "group flex h-full flex-col justify-between gap-10 rounded-xl bg-card p-7 text-left ring-1 ring-foreground/10 transition outline-none hover:shadow-xl hover:ring-primary focus-visible:ring-2 focus-visible:ring-primary 2xl:p-9";

/** One large, fully clickable option on the first-steps screen. */
export function ChoiceTile({
  icon: Icon,
  title,
  description,
  action,
  href,
  onClick,
}: ChoiceTileProps) {
  const content = (
    <>
      <span className="flex flex-col gap-5">
        <span className="flex size-14 items-center justify-center rounded-xl border bg-muted/40 transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground 2xl:size-16">
          <Icon className="size-7 2xl:size-8" />
        </span>
        <span className="flex flex-col gap-2">
          <span className="text-2xl font-medium 2xl:text-3xl">{title}</span>
          <span className="text-base text-muted-foreground 2xl:text-lg">
            {description}
          </span>
        </span>
      </span>
      <span className="inline-flex items-center gap-2 text-base font-medium 2xl:text-lg">
        {action}
        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={tileClassName}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={tileClassName}>
      {content}
    </button>
  );
}
