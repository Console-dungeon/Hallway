import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/** Frame shared by all auth screens: title, short explanation, content, links below. */
export function AuthCard({
  title,
  description,
  footer,
  children,
}: AuthCardProps) {
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
