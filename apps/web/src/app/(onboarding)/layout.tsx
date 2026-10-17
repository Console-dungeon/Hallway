import { redirect } from "next/navigation";

import { OnboardingShell } from "@/components/page-shell";
import { getMe } from "@/lib/me";

/** Full-page screens without the app navigation: first steps and the founding wizard. */
export default async function OnboardingLayout({ children }: LayoutProps<"/">) {
  const me = await getMe();
  if (!me) redirect("/login");

  return <OnboardingShell userName={me.user.name}>{children}</OnboardingShell>;
}
