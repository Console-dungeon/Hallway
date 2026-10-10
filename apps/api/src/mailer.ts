import nodemailer from "nodemailer";

import type { Env } from "./env.js";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Port for sending e-mail; callers don't know whether it's SMTP or (later) a queue. */
export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

/** SMTP adapter: Mailpit locally, a transactional e-mail provider on servers. */
export function createSmtpMailer(env: Env): Mailer {
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // 465 is implicit TLS; other ports upgrade with STARTTLS when the server offers it
    secure: env.SMTP_PORT === 465,
    ...(env.SMTP_USER && {
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD ?? "" },
    }),
  });

  return {
    async send(message) {
      await transport.sendMail({ from: env.SMTP_FROM, ...message });
    },
  };
}
