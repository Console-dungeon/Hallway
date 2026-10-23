import { AppHeader } from "./app-header";

/** Signed-out screens: the brand above a narrow column with a card. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-muted/40 p-6">
      <p className="text-3xl font-semibold tracking-tight 2xl:text-4xl">
        Hallway
      </p>
      <div className="w-full max-w-md 2xl:max-w-xl">{children}</div>
    </main>
  );
}

/** Full-page screens of a signed-in user without the app navigation, content centred. */
export function OnboardingShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-muted/40">
      <AppHeader userName={userName} />
      <main className="flex flex-1 flex-col items-center justify-center px-4 pt-6 pb-16 sm:px-6 2xl:pb-24">
        {children}
      </main>
    </div>
  );
}
