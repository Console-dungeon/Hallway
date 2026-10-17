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
  /** Last line, for someone who did not expect the e-mail. */
  ignoreNote?: string;
}

const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Texts can carry what users typed (community or person names), so never raw HTML. */
function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] ?? char);
}

/**
 * Shared look of transactional e-mails: heading, one paragraph, one button. All fields
 * are plain text; the HTML version escapes them.
 */
export function actionEmail(email: ActionEmail): MailContent {
  const {
    subject,
    heading,
    body,
    action,
    url,
    ignoreNote = "Jeśli to nie Ty, zignoruj tę wiadomość.",
  } = email;
  const html = {
    heading: escapeHtml(heading),
    body: escapeHtml(body),
    action: escapeHtml(action),
    url: escapeHtml(url),
    ignoreNote: escapeHtml(ignoreNote),
  };
  return {
    subject,
    text: `${heading}\n\n${body}\n\n${action}: ${url}\n\n${ignoreNote}`,
    html: `<!doctype html>
<html lang="pl">
  <body style="font-family: system-ui, sans-serif; color: #111; line-height: 1.5;">
    <h1 style="font-size: 20px;">${html.heading}</h1>
    <p>${html.body}</p>
    <p><a href="${html.url}" style="display: inline-block; padding: 10px 16px; background: #111; color: #fff; border-radius: 6px; text-decoration: none;">${html.action}</a></p>
    <p style="font-size: 13px; color: #555;">Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:<br>${html.url}</p>
    <p style="font-size: 13px; color: #555;">${html.ignoreNote}</p>
  </body>
</html>`,
  };
}
