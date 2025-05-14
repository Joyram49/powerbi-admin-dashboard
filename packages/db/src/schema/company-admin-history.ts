import { pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";

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

// Validation schema serves as validation for trpc procedure input
export const companyAdminHistorySchema = z.object({
  companyId: z.string().uuid({
    message: "Company ID must be a valid UUID",
  }),
  changeType: z
    .enum(["ownership_transfer", "admin_change", "company_sale"], {
      message: "Invalid change type",
    })
    .default("admin_change"),
  changeReason: z.string().max(500).optional(),
  previousAdminId: z.string().uuid({
    message: "Previous admin ID must be a valid UUID",
  }),
  previousAdminName: z.string().max(255).optional(),
  previousAdminEmail: z
    .string()
    .email({
      message: "Invalid previous admin email",
    })
    .max(255)
    .optional(),
  newAdminId: z.string().uuid({
    message: "New admin ID must be a valid UUID",
  }),
  newAdminName: z.string().max(255).optional(),
  newAdminEmail: z
    .string()
    .email({
      message: "Invalid new admin email",
    })
    .max(255)
    .optional(),
  previousCompanyName: z.string().max(255).optional(),
  newCompanyName: z.string().max(255).optional(),
  previousCompanyStatus: z.string().max(50).optional(),
  newCompanyStatus: z.string().max(50).optional(),
});

// Type for selecting data from the table
export type CompanyAdminHistory = typeof companyAdminHistory.$inferSelect;

// These types will serve as input data and form state
export type CreateCompanyAdminHistory = z.infer<
  typeof companyAdminHistorySchema
>;
