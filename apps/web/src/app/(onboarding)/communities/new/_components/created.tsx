import { Check, DoorOpen, Users } from "lucide-react";

import { Button } from "@/components/ui/button";

import { stepButtonClassName } from "./step-actions";

interface CreatedProps {
  /** Name of the community that has just been founded. */
  name: string;
  onOpen: () => void;
}

const NEXT_STEPS = [
  { icon: DoorOpen, text: "Dodaj lokale do klatek schodowych" },
  { icon: Users, text: "Zaproś mieszkańców i współpracowników" },
];

export function Created({ name, onOpen }: CreatedProps) {
  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-6 rounded-xl bg-card p-7 text-center ring-1 ring-foreground/10 2xl:max-w-xl 2xl:gap-7 2xl:p-9">
      <span className="flex size-14 items-center justify-center rounded-full border border-success-border bg-success-muted text-success 2xl:size-16">
        <Check className="size-7 2xl:size-8" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium 2xl:text-3xl">
          Wspólnota jest gotowa
        </h1>
        <p className="text-base text-muted-foreground 2xl:text-lg">
          {name} została założona, a Ty jesteś jej administratorem.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 rounded-lg border bg-muted/40 p-4 text-left text-base 2xl:text-lg">
        <p className="font-medium">Co dalej</p>
        <ul className="flex flex-col gap-3">
          {NEXT_STEPS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <Icon className="size-5 shrink-0 text-muted-foreground" />
              {text}
            </li>
          ))}
        </ul>
      </div>
      <Button className={`${stepButtonClassName} w-full`} onClick={onOpen}>
        Przejdź do wspólnoty
      </Button>
    </div>
  );
}
