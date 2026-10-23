import { AuthShell, OnboardingShell } from "@/components/page-shell";
import { getMe } from "@/lib/me";

/**
 * Pages opened from an e-mail link, signed in or not: signed in they look like the first
 * steps (header with sign-out), signed out like the sign-in pages.
 */
export default async function InvitationLayout({ children }: LayoutProps<"/">) {
  const me = await getMe();
  if (!me) return <AuthShell>{children}</AuthShell>;

  return (
    <OnboardingShell userName={me.user.name}>
      <div className="w-full max-w-md 2xl:max-w-xl">{children}</div>
    </OnboardingShell>
  );
}
