import { methods } from "../modules/auth/auth.procedures.js";
import { get as getMe } from "../modules/me/me.procedures.js";
import { health } from "../modules/system/health.procedures.js";
import { os } from "./context.js";

export const router = os.router({
  auth: { methods },
  me: { get: getMe },
  system: { health },
});
