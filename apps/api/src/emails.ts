import type { MailMessage } from "./mailer.js";

type Content = Omit<MailMessage, "to">;

function layout(heading: string, body: string, action: string, url: string) {
  return {
    text: `${heading}\n\n${body}\n\n${action}: ${url}\n\nJeśli to nie Ty, zignoruj tę wiadomość.`,
    html: `<!doctype html>
<html lang="pl">
  <body style="font-family: system-ui, sans-serif; color: #111; line-height: 1.5;">
    <h1 style="font-size: 20px;">${heading}</h1>
    <p>${body}</p>
    <p><a href="${url}" style="display: inline-block; padding: 10px 16px; background: #111; color: #fff; border-radius: 6px; text-decoration: none;">${action}</a></p>
    <p style="font-size: 13px; color: #555;">Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:<br>${url}</p>
    <p style="font-size: 13px; color: #555;">Jeśli to nie Ty, zignoruj tę wiadomość.</p>
  </body>
</html>`,
  };
}

export function verificationEmail(url: string): Content {
  return {
    subject: "Potwierdź adres e-mail w Hallway",
    ...layout(
      "Potwierdź swój adres e-mail",
      "Dziękujemy za rejestrację w Hallway. Kliknij poniżej, aby aktywować konto.",
      "Potwierdź adres e-mail",
      url,
    ),
  };
}

export function resetPasswordEmail(url: string): Content {
  return {
    subject: "Reset hasła w Hallway",
    ...layout(
      "Ustaw nowe hasło",
      "Otrzymaliśmy prośbę o zmianę hasła do Twojego konta w Hallway. Link jest ważny przez godzinę.",
      "Ustaw nowe hasło",
      url,
    ),
  };
}
