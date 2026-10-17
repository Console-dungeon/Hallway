import { cn } from "cn";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

/** Shown when an address leads nowhere, or to something the visitor may not see. */
export function NotFoundMessage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight 2xl:text-4xl">
          Nie ma takiej strony
        </h1>
        <p className="text-lg text-muted-foreground 2xl:text-xl">
          Adres jest nieprawidłowy albo nie masz dostępu do tego miejsca.
        </p>
      </div>
      <Link
        href="/"
        className={cn(
          buttonVariants(),
          "h-12 px-6 text-base 2xl:h-14 2xl:text-lg",
        )}
      >
        Wróć na pulpit
      </Link>
    </div>
  );
}
