import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const companyStatus = pgEnum("company_status", [
  "active",
  "inactive",
  "pending",
  "suspended",
]);

// Do NOT import `users` directly! Avoid circular dependencies.
export const companies = pgTable("company", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  companyAdminId: uuid("company_admin_id").notNull(),
  dateJoined: timestamp("date_joined").defaultNow(),
  status: companyStatus("status").default("active"),
  lastActivity: timestamp("last_activity"),
  modifiedBy: varchar("modified_by", { length: 255 }),
});

// Move type export **below** all schema definitions
export type Company = typeof companies.$inferSelect;
