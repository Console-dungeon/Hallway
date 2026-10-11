import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { getMe } from "@/lib/me";

/** Full-page screens without the app navigation: first steps and the founding wizard. */
export default async function OnboardingLayout({ children }: LayoutProps<"/">) {
  const me = await getMe();
  if (!me) redirect("/login");

  return (
    <div className="flex flex-1 flex-col bg-muted/40">
      <AppHeader userName={me.user.name} />
      <main className="flex flex-1 flex-col items-center justify-center px-4 pt-6 pb-16 sm:px-6 2xl:pb-24">
        {children}
      </main>
    </div>
  );
}
