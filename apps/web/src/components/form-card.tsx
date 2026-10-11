import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FormCardProps {
  title: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** Card around a form: title, short explanation, content, links below. */
export function FormCard({
  title,
  description,
  footer,
  children,
}: FormCardProps) {
  return (
    <Card className="[--card-spacing:--spacing(7)] 2xl:[--card-spacing:--spacing(9)]">
      <CardHeader>
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
