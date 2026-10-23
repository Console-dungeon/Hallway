import { authClient } from "./auth-client";
import { AuthError } from "./auth-errors";

/**
 * Sends the browser to GitHub's consent screen. On success the page is left, so nothing
 * runs afterwards; a refusal comes back to /login as ?error=…. The paths are ours (never
 * taken from the address), e.g. an invitation to go back to.
 */
export async function signInWithGithub(
  paths: { callbackURL: string; errorCallbackURL: string } = {
    callbackURL: "/",
    errorCallbackURL: "/login",
  },
) {
  const { error } = await authClient.signIn.social({
    provider: "github",
    ...paths,
  });
  if (error) throw new AuthError(error);
}
