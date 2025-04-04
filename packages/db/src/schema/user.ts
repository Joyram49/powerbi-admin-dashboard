import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./company";

export const userRoleEnum = pgEnum("user_role", [
  "superAdmin",
  "admin",
  "user",
]);

// Export the enum to register it with the database
export const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);

export const users = pgTable("user", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userName: varchar("user_name", { length: 255 }).unique().notNull(),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  email: varchar("email", { length: 255 }).unique().notNull(),
  companyId: uuid("company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  role: userRoleEnum("role").notNull().default("user"),
  dateCreated: timestamp("date_created", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastLogin: timestamp("last_login", { withTimezone: true }),
  modifiedBy: varchar("modified_by", { length: 255 }),
  status: userStatusEnum("status").default("active"),
  passwordHistory: jsonb("password_history").$type<string[]>().default([]),
});

// Move type export **below** all schema definitions
export type User = typeof users.$inferSelect;
