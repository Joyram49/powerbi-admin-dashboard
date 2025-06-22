import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { companies } from "./company";

// Export the enum so it can be properly registered with the database
export const reportStatusEnum = pgEnum("report_status", ["active", "inactive"]);

export const reports = pgTable(
  "report",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    reportName: varchar("report_name", { length: 255 }).notNull().unique(),
    dateCreated: timestamp("date_created", { withTimezone: true }).defaultNow(),
    modifiedBy: varchar("modified_by", { length: 255 }),
    lastModifiedAt: timestamp("last_modified_at", { withTimezone: true }),
    status: reportStatusEnum("status").default("active"),
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }),
    reportUrl: text("report_url").notNull().unique(),
    accessCount: integer("access_count").notNull().default(0),
  },
  (table) => ({
    // Single column indexes
    reportNameIdx: index("report_name_idx").on(table.reportName),
    companyIdIdx: index("report_company_id_idx").on(table.companyId),
    statusIdx: index("report_status_idx").on(table.status),
    dateCreatedIdx: index("report_date_created_idx").on(table.dateCreated),
    lastModifiedAtIdx: index("report_last_modified_idx").on(
      table.lastModifiedAt,
    ),
    accessCountIdx: index("report_access_count_idx").on(table.accessCount),

    // Composite indexes for common query patterns
    companyStatusIdx: index("report_company_status_idx").on(
      table.companyId,
      table.status,
    ),
    companyDateIdx: index("report_company_date_idx").on(
      table.companyId,
      table.dateCreated,
    ),
    statusDateIdx: index("report_status_date_idx").on(
      table.status,
      table.dateCreated,
    ),
    nameStatusIdx: index("report_name_status_idx").on(
      table.reportName,
      table.status,
    ),

    // Partial indexes for active reports (most common query)
    activeReportsIdx: index("report_active_idx")
      .on(table.companyId, table.dateCreated, table.reportName)
      .where(sql`${table.status} = 'active'`),
  }),
);

export const reportRouterSchema = {
  create: z.object({
    reportName: z
      .string()
      .min(3, { message: "Report name must be at least 3 characters" }),
    reportUrl: z.string().url(),
    companyId: z.string().uuid(),
    status: z.enum(["active", "inactive"]).default("active"),
    userIds: z.array(z.string().uuid()),
  }),
  getAllReports: z
    .object({
      searched: z.string().toLowerCase().optional().default(""),
      limit: z.number().optional().default(10),
      page: z.number().optional().default(1),
      sortBy: z
        .enum(["reportName", "dateCreated"])
        .optional()
        .default("dateCreated"),
      status: z.enum(["active", "inactive"]).optional(),
    })
    .optional(),
  getAllReportsAdmin: z
    .object({
      searched: z.string().optional().default(""),
      limit: z.number().optional().default(10),
      page: z.number().optional().default(1),
      sortBy: z
        .enum(["reportName", "dateCreated"])
        .optional()
        .default("dateCreated"),
    })
    .optional(),
  getAllReportsUser: z
    .object({
      searched: z.string().optional().default(""),
      limit: z.number().optional().default(10),
      page: z.number().optional().default(1),
    })
    .optional(),
  getAllReportsForCompany: z.object({
    companyId: z.string().uuid(),
    limit: z.number().optional().default(10),
    page: z.number().optional().default(1),
    searched: z.string().toLowerCase().optional().default(""),
  }),
  getReportById: z.object({
    reportId: z.string().uuid(),
  }),
  updateReport: z.object({
    reportId: z.string().uuid(),
    reportName: z.string().min(3).optional().or(z.literal("")),
    reportUrl: z.string().url().optional().or(z.literal("")),
    companyId: z.string().uuid().optional().or(z.literal("")),
    accessCount: z.number().optional(),
    status: z.enum(["active", "inactive"]).optional(),
    userIds: z
      .array(z.string().uuid())
      .optional()
      .or(z.array(z.string().uuid()).length(0)),
  }),
  updateUserOfReportByAdmin: z.object({
    reportId: z.string().uuid(),
    userIds: z.array(z.string().uuid()),
  }),
  incrementReportView: z.object({
    reportId: z.string().uuid(),
  }),
  deleteReport: z.object({
    reportId: z.string().uuid(),
  }),
};

export type Report = typeof reports.$inferSelect;

export interface ReportType {
  id: string;
  reportName: string;
  dateCreated: Date | null;
  modifiedBy: string | null;
  lastModifiedAt: Date | null;
  status: "active" | "inactive" | null;
  reportUrl: string;
  accessCount: number;
  userCounts: number;
  company: {
    id: string;
    companyName: string;
  } | null;
}

export interface ReportWithUsers {
  id: string;
  reportName: string;
  reportUrl: string;
  accessCount?: number | null;
  dateCreated?: Date | null;
  status: "active" | "inactive" | null;
  lastModifiedAt?: Date | null;
  company: {
    id: string;
    companyName: string;
  } | null;
  userCounts?: number;
  usersList?: { id: string; userName: string; email: string }[];
}
