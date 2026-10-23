/**
 * Invitation tokens are base64url (see apps/api invitations.service). Anything else in a
 * link or a query parameter is not a token, so it never ends up in a path we build.
 */
const TOKEN = /^[A-Za-z0-9_-]{1,200}$/;

/** The token from a query parameter, or undefined when it doesn't look like one. */
export function invitationTokenFrom(
  value: string | undefined,
): string | undefined {
  return value !== undefined && TOKEN.test(value) ? value : undefined;
}

/** Path of the invitation page; built here so a token never becomes an open redirect. */
export function invitationPath(token: string) {
  return `/invitations/${encodeURIComponent(token)}`;
}

/** Sign-in that comes back to the invitation afterwards. */
export function invitationLoginPath(token: string) {
  return `/login?invitation=${encodeURIComponent(token)}`;
}

/**
 * The token from pasted text: a whole link (…/invitations/<token>, with or without the
 * origin) or the bare token. Undefined when the text is neither.
 */
export function findInvitationToken(text: string): string | undefined {
  const value = text.trim();
  const fromLink = /\/invitations\/([A-Za-z0-9_-]+)/.exec(value)?.[1];
  if (fromLink) return invitationTokenFrom(fromLink);
  // A bare token is long; a short word is more likely a typo than a token
  return value.length >= 20 ? invitationTokenFrom(value) : undefined;
}
