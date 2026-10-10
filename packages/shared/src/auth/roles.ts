import { z } from "zod";

/** Platform-wide account role. Roles inside a community live in memberships, not here. */
export const userRoles = ["user", "superadmin"] as const;

export const userRoleSchema = z.enum(userRoles);

export type UserRole = z.infer<typeof userRoleSchema>;
