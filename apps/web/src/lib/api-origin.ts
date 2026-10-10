/**
 * Where server-side code (RSC, route handlers) reaches the API: API_INTERNAL_URL in Docker,
 * localhost in dev. The browser never uses this; it calls /api on its own origin.
 */
export const serverApiOrigin =
  process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3001";
