import { actionEmail } from "../../mail/layout.js";

export const resetPasswordEmail = (url: string) =>
  actionEmail({
    subject: "Reset hasła w Hallway",
    heading: "Ustaw nowe hasło",
    body: "Otrzymaliśmy prośbę o zmianę hasła do Twojego konta w Hallway. Link jest ważny przez godzinę.",
    action: "Ustaw nowe hasło",
    url,
  });
