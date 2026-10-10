import { actionEmail } from "../../mail/layout.js";

export const verificationEmail = (url: string) =>
  actionEmail({
    subject: "Potwierdź adres e-mail w Hallway",
    heading: "Potwierdź swój adres e-mail",
    body: "Dziękujemy za rejestrację w Hallway. Kliknij poniżej, aby aktywować konto.",
    action: "Potwierdź adres e-mail",
    url,
  });
