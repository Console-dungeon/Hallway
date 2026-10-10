import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const publicPaths = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
];

/**
 * Convenience only: sends visitors without a session cookie to /login before anything
 * renders. The cookie is not validated here; the (app) layout does the real check.
 */
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (publicPaths.includes(pathname) || getSessionCookie(request)) {
    return NextResponse.next();
  }

  const login = new URL("/login", request.url);
  // Better Auth reports a failed e-mail link as ?error=… on the callback URL
  const error = searchParams.get("error");
  if (error) login.searchParams.set("error", error);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
