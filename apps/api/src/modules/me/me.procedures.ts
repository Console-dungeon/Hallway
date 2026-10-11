import { userRoleSchema } from "@hallway/shared";

import { os } from "../../orpc/context.js";
import { requireAuth } from "../../orpc/middleware.js";
import { listCommunitiesOf, listUnitsOf } from "./me.queries.js";

export const get = os.me.get.use(requireAuth).handler(async ({ context }) => {
  const { user, db } = context;
  const [communities, units] = await Promise.all([
    listCommunitiesOf(db, user.id),
    listUnitsOf(db, user.id),
  ]);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      // Better Auth types the column as a free-form string
      role: userRoleSchema.parse(user.role),
    },
    communities,
    units,
  };
});
