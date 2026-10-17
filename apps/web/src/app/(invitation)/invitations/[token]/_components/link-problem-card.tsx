import Link from "next/link";

import { FormAlert } from "@/components/form-alert";
import { FormCard } from "@/components/form-card";

const problems = {
  expired: {
    title: "Link wygasł",
    message:
      "Zaproszenie było ważne 7 dni. Poproś administratora wspólnoty o nowe zaproszenie.",
  },
  invalid: {
    title: "Link jest nieprawidłowy",
    message:
      "Ten link nie prowadzi do żadnego zaproszenia. Sprawdź, czy skopiowano go w całości, albo poproś administratora wspólnoty o nowe zaproszenie.",
  },
} as const;

/** The link can't be used: expired, or unknown, revoked or used up (no details given). */
export function LinkProblemCard({ kind }: { kind: keyof typeof problems }) {
  const { title, message } = problems[kind];
  return (
    <FormCard
      title={title}
      footer={
        <Link href="/" className="underline underline-offset-4">
          Wróć do strony głównej
        </Link>
      }
    >
      <FormAlert>{message}</FormAlert>
    </FormCard>
  );
}
