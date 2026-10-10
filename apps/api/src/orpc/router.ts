import { health } from "../modules/system/health.procedures.js";
import { os } from "./context.js";

export const router = os.router({
  system: { health },
});
