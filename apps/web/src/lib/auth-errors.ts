/** Error shape returned by Better Auth client calls. */
export interface AuthClientError {
  code?: string | undefined;
  status: number;
}

const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Nieprawidłowy e-mail lub hasło.",
  INVALID_EMAIL: "Podaj poprawny adres e-mail.",
  EMAIL_NOT_VERIFIED: "Najpierw potwierdź adres e-mail.",
  USER_ALREADY_EXISTS: "Konto z tym adresem e-mail już istnieje.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "Konto z tym adresem e-mail już istnieje.",
  PASSWORD_TOO_SHORT: "Hasło jest za krótkie.",
  PASSWORD_TOO_LONG: "Hasło jest za długie.",
  INVALID_TOKEN: "Link jest nieprawidłowy lub wygasł.",
  TOKEN_EXPIRED: "Link wygasł.",
  BANNED_USER: "To konto zostało zablokowane.",
  // OAuth redirects (GitHub)
  ACCESS_DENIED: "Logowanie przez GitHub zostało anulowane.",
  STATE_MISMATCH: "Sesja logowania wygasła. Spróbuj ponownie.",
  STATE_NOT_FOUND: "Sesja logowania wygasła. Spróbuj ponownie.",
  PLEASE_RESTART_THE_PROCESS: "Sesja logowania wygasła. Spróbuj ponownie.",
  ACCOUNT_NOT_LINKED:
    "Konto z tym adresem e-mail już istnieje. Zaloguj się hasłem.",
  EMAIL_NOT_FOUND:
    "GitHub nie udostępnił adresu e-mail. Zaloguj się e-mailem i hasłem.",
};

/** Polish message for a Better Auth error; codes also arrive lowercased in redirect URLs. */
export function authErrorMessage(error: AuthClientError | string): string {
  if (typeof error !== "string" && error.status === 429) {
    return "Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.";
  }
  const code = typeof error === "string" ? error : error.code;
  return (
    messages[code?.toUpperCase() ?? ""] ??
    "Coś poszło nie tak. Spróbuj ponownie."
  );
}

/**
 * Message for the `error` query parameter of a redirect back from Better Auth. A redirect
 * can carry several values (e.g. provider name and error code); the first known code wins.
 */
export function redirectErrorMessage(
  error: string | string[] | undefined,
): string | undefined {
  const codes = [error].flat().filter((code) => code !== undefined);
  if (codes.length === 0) return undefined;
  const known = codes.find((code) => code.toUpperCase() in messages);
  return authErrorMessage(known ?? "");
}

/** Thrown from mutation functions so TanStack Query exposes the auth error. */
export class AuthError extends Error {
  readonly code: string | undefined;

  constructor(error: AuthClientError) {
    super(authErrorMessage(error));
    this.name = "AuthError";
    this.code = error.code;
  }
}
