import { oc } from "@orpc/contract";

/** Errors every procedure behind sign-in can answer with. */
export const accessErrors = {
  UNAUTHORIZED: { status: 401, message: "Zaloguj się, aby kontynuować." },
  FORBIDDEN: {
    status: 403,
    message: "Nie masz uprawnień do tej operacji.",
  },
} as const;

/** Start contracts of protected procedures from this instead of `oc`. */
export const protectedContract = oc.errors(accessErrors);
