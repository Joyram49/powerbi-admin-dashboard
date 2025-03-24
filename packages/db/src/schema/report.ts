import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

import { companies } from "./company";

// Export the enum so it can be properly registered with the database
export const reportStatusEnum = pgEnum("report_status", ["active", "inactive"]);

export const reports = pgTable("report", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  reportName: varchar("report_name", { length: 255 }).notNull().unique(),
  dateCreated: timestamp("date_created").defaultNow(),
  modifiedBy: varchar("modified_by", { length: 255 }),
  lastModifiedAt: timestamp("last_modified_at"),
  status: reportStatusEnum("status").default("active"),
  companyId: uuid("company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  reportUrl: text("report_url").notNull().unique(),
  accessCount: integer("access_count").default(0),
});

export const createReportSchema = createInsertSchema(reports).omit({
  id: true,
  dateCreated: true,
  accessCount: true,
});

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
