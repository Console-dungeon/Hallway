import { Button } from "@/components/ui/button";

import { FormAlert } from "./form-alert";

interface GithubButtonProps {
  onClick: () => void;
  isPending: boolean;
  error?: string | undefined;
}

/** "Continue with GitHub" – view only; the page's controller starts the sign-in. */
export function GithubButton({ onClick, isPending, error }: GithubButtonProps) {
  return (
    <>
      {error && <FormAlert>{error}</FormAlert>}
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full text-base 2xl:h-14 2xl:text-lg"
        disabled={isPending}
        onClick={onClick}
      >
        Kontynuuj przez GitHub
      </Button>
    </>
  );
}
