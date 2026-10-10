import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface TextFieldProps extends Omit<
  React.ComponentProps<typeof Input>,
  "id"
> {
  name: string;
  label: string;
  error?: string | undefined;
  /** Shown on the right of the label, e.g. a "forgot password" link. */
  labelAction?: React.ReactNode;
}

export function TextField({
  name,
  label,
  error,
  labelAction,
  ...inputProps
}: TextFieldProps) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <div className="flex items-center justify-between">
        <FieldLabel htmlFor={name} className="text-base 2xl:text-lg">
          {label}
        </FieldLabel>
        {labelAction}
      </div>
      <Input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className="h-12 px-3.5 text-base md:text-base 2xl:h-14 2xl:px-4 2xl:text-lg"
        {...inputProps}
      />
      {error && <FieldError id={`${name}-error`}>{error}</FieldError>}
    </Field>
  );
}
