import {
  boolean,
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

export const users = pgTable("user", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userName: varchar("user_name", { length: 255 }).unique().notNull(),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  email: varchar("email", { length: 255 }).unique().notNull(),
  companyId: uuid("company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  role: userRoleEnum("role").notNull().default("user"),
  dateCreated: timestamp("date_created").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  modifiedBy: varchar("modified_by", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("active"),
});

// Move type export **below** all schema definitions
export type User = typeof users.$inferSelect;
