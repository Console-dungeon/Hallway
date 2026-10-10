import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

import { SignOutButton } from "./_components/sign-out-button/sign-out-button";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // The real access check for everything behind sign-in (proxy.ts only looks at the cookie)
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <header className="flex items-center justify-between border-b px-6 py-3">
        <p className="font-semibold tracking-tight">Hallway</p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {session.user.name}
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col p-6">{children}</main>
    </>
  );
}
