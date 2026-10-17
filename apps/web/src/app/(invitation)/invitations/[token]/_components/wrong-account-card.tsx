import { cn } from "cn";
import { CircleAlert } from "lucide-react";
import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { FormCard } from "@/components/form-card";
import { Button, buttonVariants } from "@/components/ui/button";

interface WrongAccountCardProps {
  invitationEmail: string;
  accountEmail: string;
  error?: string | undefined;
  isPending: boolean;
  onSwitchAccount: () => void;
}

const buttonClassName = "h-12 w-full text-base 2xl:h-14 2xl:text-lg";

/** Signed in, but not with the address the invitation was sent to. */
export function WrongAccountCard({
  invitationEmail,
  accountEmail,
  error,
  isPending,
  onSwitchAccount,
}: WrongAccountCardProps) {
  return (
    <FormCard
      icon={CircleAlert}
      title="To zaproszenie jest dla innego konta"
      description={`To zaproszenie jest dla ${invitationEmail}, a jesteś zalogowany jako ${accountEmail}.`}
    >
      <div className="flex flex-col gap-4">
        {error && <FormAlert>{error}</FormAlert>}
        <Button
          type="button"
          className={cn(buttonClassName, "whitespace-normal")}
          disabled={isPending}
          onClick={onSwitchAccount}
        >
          Wyloguj się i zaloguj na właściwe konto
        </Button>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline" }),
            buttonClassName,
          )}
        >
          Wróć do pulpitu
        </Link>
      </div>
    </FormCard>
  );
}
