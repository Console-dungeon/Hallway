import { expect } from "@playwright/test";

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:8025";

interface MessageSummary {
  ID: string;
  Subject: string;
  To: { Address: string }[];
}

/** The link of an invitation e-mail, split into what the tests need. */
export interface InvitationLink {
  /** Path of the invitation page, e.g. "/invitations/abc…"; open it with `page.goto`. */
  path: string;
  /** The token alone, for the API (`/api/invitations/<token>/accept`). */
  token: string;
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
    // The text has \r\n line ends; a link never contains whitespace
    const link = /https?:\/\/\S+/.exec(Text.replaceAll("\r", ""))?.[0];
    if (!link) throw new Error(`No link in e-mail "${subject}" to ${to}`);
    return link;
  }

  /**
   * Waits for the newest invitation to `to` from the community and returns its link. The
   * token is only in the e-mail (the database keeps its hash).
   */
  async invitationFrom({
    to,
    communityName,
  }: {
    to: string;
    communityName: string;
  }): Promise<InvitationLink> {
    const link = await this.linkFrom({
      to,
      subject: invitationSubject(communityName),
    });
    const path = new URL(link).pathname;
    const token = /^\/invitations\/([A-Za-z0-9_-]+)$/.exec(path)?.[1];
    if (!token) throw new Error(`Not an invitation link: ${link}`);
    return { path, token };
  }

  /** Subjects of every e-mail sent to `to`, newest first. */
  async subjectsTo(to: string) {
    return (await this.messagesTo(to)).map((message) => message.Subject);
  }

  private async find(to: string, subject: string) {
    // Newest first, so a re-sent e-mail wins over the original
    return (await this.messagesTo(to)).find((message) =>
      message.Subject.includes(subject),
    );
  }

  /** Searched by recipient, so many e-mails sent at once by parallel tests don't hide it. */
  private async messagesTo(to: string) {
    const query = encodeURIComponent(`to:"${to}"`);
    const response = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=${query}&limit=50`,
    );
    const { messages } = (await response.json()) as {
      messages: MessageSummary[];
    };
    return messages.filter((message) =>
      message.To.some((recipient) => recipient.Address === to),
    );
  }
}

/** Subject of the invitation e-mail (apps/api/src/modules/invitations/email-templates). */
export function invitationSubject(communityName: string) {
  return `Zaproszenie do wspólnoty ${communityName} w Hallway`;
}
