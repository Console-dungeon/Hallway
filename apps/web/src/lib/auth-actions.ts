import { authClient } from "./auth-client";
import { AuthError } from "./auth-errors";

/**
 * Sends the browser to GitHub's consent screen. On success the page is left, so nothing
 * runs afterwards; a refusal comes back to /login as ?error=….
 */
export async function signInWithGithub() {
  const { error } = await authClient.signIn.social({
    provider: "github",
    callbackURL: "/",
    errorCallbackURL: "/login",
  });
  if (error) throw new AuthError(error);
}
