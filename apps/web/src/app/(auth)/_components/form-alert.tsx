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
    <Alert
      variant={variant}
      className="px-3.5 py-3 text-base 2xl:px-4 2xl:text-lg"
    >
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
