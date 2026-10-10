import { Alert, AlertDescription } from "@/components/ui/alert";

/** Message above a form: an error by default, or a neutral notice. */
export function FormAlert({
  children,
  variant = "destructive",
}: {
  children: React.ReactNode;
  variant?: "default" | "destructive";
}) {
  return (
    <Alert variant={variant}>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
