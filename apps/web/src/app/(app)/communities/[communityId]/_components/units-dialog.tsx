import { UNIT_SERIES_MAX } from "@hallway/shared";

import { FormAlert } from "@/components/form-alert";
import {
  dialogButtonClassName,
  DialogActions,
  FormDialog,
} from "@/components/form-dialog";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { LOKAL, plural } from "@/lib/plural";

import type { UnitsMode } from "../useController";

interface UnitsDialogProps {
  /** Where the units go, e.g. "Lipowa 12, klatka A". */
  place: string;
  form: {
    mode: UnitsMode;
    setMode: (mode: UnitsMode) => void;
    from: string;
    setFrom: (value: string) => void;
    to: string;
    setTo: (value: string) => void;
  };
  errors: {
    from?: string | undefined;
    to?: string | undefined;
    number?: string | undefined;
    floor?: string | undefined;
  };
  formError?: string | undefined;
  isPending: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

const MODES: { mode: UnitsMode; label: string }[] = [
  { mode: "series", label: "Seria" },
  { mode: "single", label: "Pojedynczo" },
];

/** How many units a series from…to makes, or null while the range is not a valid one. */
function seriesCount(from: string, to: string) {
  const first = Number(from);
  const last = Number(to);
  if (from === "" || to === "") return null;
  if (!Number.isInteger(first) || !Number.isInteger(last)) return null;
  const count = last - first + 1;
  return first >= 1 && count >= 1 && count <= UNIT_SERIES_MAX ? count : null;
}

/** "1, 2, 3 … 20" for long series, every number for short ones. */
function seriesPreview(from: string, count: number) {
  const first = Number(from);
  const numbers = Array.from({ length: count }, (_, index) => first + index);
  return count <= 5
    ? numbers.join(", ")
    : `${numbers.slice(0, 3).join(", ")} … ${numbers.at(-1)}`;
}

export function UnitsDialog({
  place,
  form,
  errors,
  formError,
  isPending,
  onSubmit,
  onClose,
}: UnitsDialogProps) {
  const count = seriesCount(form.from, form.to);

  return (
    <FormDialog title="Dodaj lokale" description={place} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup className="2xl:gap-6">
          <div
            role="tablist"
            aria-label="Sposób dodawania"
            className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1"
          >
            {MODES.map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={form.mode === mode}
                onClick={() => form.setMode(mode)}
                className="h-10 rounded-md text-base font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring aria-selected:bg-card aria-selected:text-foreground aria-selected:ring-1 aria-selected:ring-foreground/10 2xl:h-12 2xl:text-lg"
              >
                {label}
              </button>
            ))}
          </div>
          {formError && <FormAlert>{formError}</FormAlert>}
          {form.mode === "series" ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  name="from"
                  label="Numery od"
                  inputMode="numeric"
                  value={form.from}
                  onChange={(event) => form.setFrom(event.target.value)}
                  error={errors.from}
                />
                <TextField
                  name="to"
                  label="do"
                  inputMode="numeric"
                  value={form.to}
                  onChange={(event) => form.setTo(event.target.value)}
                  error={errors.to}
                  autoFocus
                />
              </div>
              <div className="rounded-lg border bg-muted/40 px-3.5 py-3">
                <p className="font-medium 2xl:text-lg">
                  {count === null
                    ? "Podaj pierwszy i ostatni numer serii."
                    : `Powstanie ${plural(count, LOKAL)}: ${seriesPreview(form.from, count)}`}
                </p>
                <p className="text-sm text-muted-foreground 2xl:text-base">
                  Numery, które już są w tej klatce, zostaną pominięte.
                </p>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <TextField
                name="number"
                label="Numer lokalu"
                placeholder="np. 12A"
                error={errors.number}
                autoFocus
              />
              <TextField
                name="floor"
                label="Piętro (opcjonalnie)"
                inputMode="numeric"
                placeholder="np. 3"
                error={errors.floor}
              />
            </div>
          )}
          <DialogActions>
            <Button
              type="button"
              variant="outline"
              className={dialogButtonClassName}
              onClick={onClose}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              className={dialogButtonClassName}
              disabled={isPending}
            >
              {form.mode === "single"
                ? "Dodaj lokal"
                : count === null
                  ? "Dodaj lokale"
                  : `Dodaj ${plural(count, LOKAL)}`}
            </Button>
          </DialogActions>
        </FieldGroup>
      </form>
    </FormDialog>
  );
}
