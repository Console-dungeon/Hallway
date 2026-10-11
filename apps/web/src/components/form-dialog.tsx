import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FormDialogProps {
  title: string;
  description?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

/** Size shared by every button of a dialog. */
export const dialogButtonClassName =
  "h-12 px-5 text-base 2xl:h-14 2xl:px-7 2xl:text-lg";

/** Window over the page for one short task: a title, an explanation, a form or a question. */
export function FormDialog({
  title,
  description,
  onClose,
  children,
}: FormDialogProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="gap-5 p-7 text-base sm:max-w-lg 2xl:max-w-xl 2xl:gap-6 2xl:p-9"
      >
        <DialogHeader className="gap-1">
          <DialogTitle className="text-2xl leading-snug 2xl:text-3xl">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-base 2xl:text-lg">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/** Bottom row of a dialog: buttons on the right, stacked on phones. */
export function DialogActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      {children}
    </div>
  );
}
