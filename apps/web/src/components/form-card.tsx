import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FormCardProps {
  /** Shown in a tile above the title. */
  icon?: LucideIcon;
  /** Above everything else, e.g. a link back. */
  before?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** Card around a form: title, short explanation, content, links below. */
export function FormCard({
  icon: Icon,
  before,
  title,
  description,
  footer,
  children,
}: FormCardProps) {
  return (
    <Card className="[--card-spacing:--spacing(7)] 2xl:[--card-spacing:--spacing(9)]">
      <CardHeader>
        {before && <div className="mb-3 flex">{before}</div>}
        {Icon && (
          <span className="mb-5 flex size-14 items-center justify-center rounded-xl border bg-muted/40 2xl:size-16">
            <Icon className="size-7 2xl:size-8" />
          </span>
        )}
        <CardTitle className="text-2xl 2xl:text-3xl">{title}</CardTitle>
        {description && (
          <CardDescription className="text-base 2xl:text-lg">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && (
        <CardFooter className="justify-center text-base text-muted-foreground 2xl:text-lg">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
