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

/** Errors of procedures that work inside one community. */
export const communityErrors = {
  NOT_FOUND: { status: 404, message: "Nie znaleziono tego elementu." },
  CONFLICT: { status: 409, message: "Taka nazwa albo numer już tu istnieje." },
  UNIT_HAS_MEMBERS: {
    status: 409,
    message:
      "Do lokalu są przypisane osoby. Najpierw usuń je z lokalu, potem usuń lokal.",
  },
} as const;

/** Start contracts of procedures with `communityId` in the path from this. */
export const communityContract = protectedContract.errors(communityErrors);
