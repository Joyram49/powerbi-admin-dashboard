import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { companies } from "./company";
import { users } from "./user";

export const changeTypeEnum = pgEnum("change_type", [
  "ownership_transfer",
  "admin_change",
  "company_sale",
]);

export const companyAdminHistory = pgTable("company_admin_history", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),

  // Previous admin info with nullable references
  previousAdminId: uuid("previous_admin_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "set null",
    }),
  previousAdminName: varchar("previous_admin_name", { length: 255 }),
  previousAdminEmail: varchar("previous_admin_email", { length: 255 }),

  // New admin info with nullable references
  newAdminId: uuid("new_admin_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "set null",
    }),
  newAdminName: varchar("new_admin_name", { length: 255 }),
  newAdminEmail: varchar("new_admin_email", { length: 255 }),

  changeType: changeTypeEnum("change_type").notNull().default("admin_change"),
  changeReason: varchar("change_reason", { length: 500 }),
  changedBy: uuid("changed_by")
    .notNull()
    .references(() => users.id),
  changeDate: timestamp("change_date", { withTimezone: true }).defaultNow(),

  // Additional metadata
  previousCompanyName: varchar("previous_company_name", { length: 255 }),
  newCompanyName: varchar("new_company_name", { length: 255 }),
  previousCompanyStatus: varchar("previous_company_status", { length: 50 }),
  newCompanyStatus: varchar("new_company_status", { length: 50 }),
});

// Move type export **below** all schema definitions
export type CompanyAdminHistory = typeof companyAdminHistory.$inferSelect;
