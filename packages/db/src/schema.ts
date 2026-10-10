import { userRoles } from "@hallway/shared";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Default columns of an entity table: spread first, `...baseColumns`.
 * A table that doesn't fit (natural key, no update tracking) defines its own columns.
 */
const baseColumns = {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// --- Authentication (Better Auth) ---
// Column set is dictated by Better Auth core + the `admin` plugin; property names must
// stay as Better Auth expects them (the Drizzle adapter addresses columns by property).

export const userRole = pgEnum("user_role", userRoles);

export const users = pgTable("users", {
  ...baseColumns,
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  role: userRole().notNull().default("user"),
  banned: boolean().notNull().default(false),
  banReason: text(),
  banExpires: timestamp({ withTimezone: true }),
  notificationsEnabled: boolean().notNull().default(true),
});

export const sessions = pgTable(
  "sessions",
  {
    ...baseColumns,
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text().notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    // Set while a superadmin is impersonating this user (admin plugin)
    impersonatedBy: uuid().references(() => users.id, { onDelete: "set null" }),
  },
  (table) => [index().on(table.userId)],
);

/** Sign-in methods of a user; for e-mail + password the hash lives in `password`. */
export const accounts = pgTable(
  "accounts",
  {
    ...baseColumns,
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text().notNull(),
    providerId: text().notNull(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
  },
  (table) => [index().on(table.userId)],
);

/** Short-lived tokens: e-mail verification, password reset. */
export const verifications = pgTable(
  "verifications",
  {
    ...baseColumns,
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [index().on(table.identifier)],
);
