"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

interface RedirectToastProps {
  message: string;
  variant: "error" | "success";
}

/**
 * Shows what happened on the way to this page (e.g. a cancelled GitHub sign-in), then
 * drops the query string so a refresh doesn't repeat the message.
 */
export function RedirectToast({ message, variant }: RedirectToastProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // The id keeps a re-run of this effect from stacking a second toast
    toast[variant](message, { id: message });
    router.replace(pathname);
  }, [message, variant, pathname, router]);

  return null;
}
