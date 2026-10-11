import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { belongsSomewhere, getMe } from "@/lib/me";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // The real access check for everything behind sign-in (proxy.ts only looks at the cookie)
  const me = await getMe();
  if (!me) redirect("/login");
  // Nothing to show yet: start with founding a community or joining one
  if (!belongsSomewhere(me)) redirect("/welcome");

  return (
    <>
      <AppHeader userName={me.user.name} className="border-b bg-card" />
      <main className="flex flex-1 flex-col p-6 2xl:p-8">{children}</main>
    </>
  );
}
