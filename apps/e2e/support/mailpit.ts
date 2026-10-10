import { expect } from "@playwright/test";

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:8025";

interface MessageSummary {
  ID: string;
  Subject: string;
  To: { Address: string }[];
}

/** Reads e-mails caught by Mailpit (docker compose), the local stand-in for a real inbox. */
export class Mailpit {
  /**
   * Waits for an e-mail sent to `to` whose subject contains `subject` and returns
   * the first link in it (verification link, reset link, …).
   */
  async linkFrom({ to, subject }: { to: string; subject: string }) {
    let id: string | undefined;
    await expect
      .poll(
        async () => {
          id = (await this.find(to, subject))?.ID;
          return id;
        },
        { message: `e-mail "${subject}" to ${to}`, timeout: 15_000 },
      )
      .toBeDefined();

    const response = await fetch(`${MAILPIT_URL}/api/v1/message/${id}`);
    const { Text } = (await response.json()) as { Text: string };
    const link = /https?:\/\/\S+/.exec(Text)?.[0];
    if (!link) throw new Error(`No link in e-mail "${subject}" to ${to}`);
    return link;
  }

  private async find(to: string, subject: string) {
    const response = await fetch(`${MAILPIT_URL}/api/v1/messages?limit=100`);
    const { messages } = (await response.json()) as {
      messages: MessageSummary[];
    };
    // Newest first, so a re-sent e-mail wins over the original
    return messages.find(
      (message) =>
        message.Subject.includes(subject) &&
        message.To.some((recipient) => recipient.Address === to),
    );
  }
}
