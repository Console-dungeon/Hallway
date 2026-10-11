import { cn } from "cn";

import { SignOutButton } from "./sign-out-button/sign-out-button";

interface AppHeaderProps {
  userName: string;
  className?: string;
}

/** Top bar of every screen behind sign-in: brand, who is signed in, sign-out. */
export function AppHeader({ userName, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 px-6 py-3 2xl:px-8 2xl:py-4",
        className,
      )}
    >
      <p className="text-xl font-semibold tracking-tight 2xl:text-2xl">
        Hallway
      </p>
      <div className="flex items-center gap-4">
        <span className="hidden text-base text-muted-foreground sm:inline 2xl:text-lg">
          {userName}
        </span>
        <SignOutButton />
      </div>
    </header>
  );
}
