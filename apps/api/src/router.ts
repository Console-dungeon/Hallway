import { health } from "./procedures/health.js";
import { os } from "./orpc.js";

export const router = os.router({
  system: { health },
});
