import type { MailMessage } from "./mailer.js";

/** What a template returns; the caller adds the recipient. */
export type MailContent = Omit<MailMessage, "to">;

interface ActionEmail {
  subject: string;
  heading: string;
  body: string;
  /** Button label and the link it opens. */
  action: string;
  url: string;
}

/** Shared look of transactional e-mails: heading, one paragraph, one button. */
export function actionEmail({
  subject,
  heading,
  body,
  action,
  url,
}: ActionEmail): MailContent {
  return {
    subject,
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
