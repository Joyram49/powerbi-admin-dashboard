import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const companyStatus = pgEnum("company_status", [
  "active",
  "inactive",
  "pending",
  "suspended",
]);

export const subscriptionTier = pgEnum("subscription_tier", [
  "data_foundation",
  "insight_accelerator",
  "strategic_navigator",
  "enterprise",
]);

export const companies = pgTable(
  "company",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    companyName: varchar("company_name", { length: 255 }).notNull(),
    address: varchar("address", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    email: varchar("email", { length: 255 }).unique(),
    dateJoined: timestamp("date_joined", { withTimezone: true }).defaultNow(),
    status: companyStatus("status").default("active"),
    lastActivity: timestamp("last_activity", { withTimezone: true }),
    modifiedBy: varchar("modified_by", { length: 255 }),
    numOfEmployees: integer("num_of_employees").notNull().default(0),
    preferredSubscriptionPlan: subscriptionTier("preferred_subscription_plan"),
  },
  (table) => ({
    // Indexes for common query patterns
    companyNameIdx: index("company_name_idx").on(table.companyName),
    statusIdx: index("company_status_idx").on(table.status),
    dateJoinedIdx: index("company_date_joined_idx").on(table.dateJoined),
    emailIdx: index("company_email_idx").on(table.email),
    lastActivityIdx: index("company_last_activity_idx").on(table.lastActivity),

    // Composite indexes for common filter combinations
    statusDateIdx: index("company_status_date_idx").on(
      table.status,
      table.dateJoined,
    ),
    nameStatusIdx: index("company_name_status_idx").on(
      table.companyName,
      table.status,
    ),

    // Partial indexes for active companies (most common query)
    activeCompaniesIdx: index("company_active_idx")
      .on(table.dateJoined, table.companyName)
      .where(sql`${table.status} = 'active'`),
  }),
);

// Base company schema without adminIds
export const baseCompanySchema = createInsertSchema(companies).omit({
  id: true,
  dateJoined: true,
  lastActivity: true,
  modifiedBy: true,
  numOfEmployees: true,
  preferredSubscriptionPlan: true,
});

const PHONE_NUMBER_REGEX =
  /^(?:(?:\+|00)?\d{1,4}[-.\s]?)?(?:\(?\d{1,4}\)?[-.\s]?)?[\d\s-]{6,20}$/;

// Base validation schema for company fields
const baseCompanyValidationSchema = z.object({
  companyName: z
    .string()
    .min(3, { message: "Company name must be at least 3 characters long" }),
  address: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) =>
        val === undefined || val.trim() === "" || PHONE_NUMBER_REGEX.test(val),
      "Invalid phone number format",
    ),
  email: z.string().email({ message: "Invalid email address" }),
});

// Validation schema for creating a company
export const createCompanySchema = baseCompanyValidationSchema.extend({
  adminIds: z.array(z.string().uuid(), {
    required_error: "At least one admin must be assigned",
    invalid_type_error: "Admin IDs must be valid UUIDs",
  }),
  preferredSubscriptionPlan: z
    .enum(subscriptionTier.enumValues)
    .optional()
    .nullable(),
});

// Validation schema for updating a company
export const updateCompanySchema = baseCompanyValidationSchema.extend({
  companyId: z.string().uuid({
    message: "Company ID must be a valid UUID",
  }),
  adminIds: z
    .array(
      z.string().uuid({
        message: "Admin IDs must be valid UUIDs",
      }),
    )
    .optional(),
});

// Unified schema for all company router endpoints
export const companyRouterSchema = {
  // Create company
  create: createCompanySchema,

  // Get company by ID
  getById: z.object({
    companyId: z.string().uuid({
      message: "Company ID must be a valid UUID",
    }),
  }),

  // Get all companies
  getAll: z
    .object({
      searched: z.string().toLowerCase().optional().default(""),
      limit: z.number().default(10),
      page: z.number().default(1),
      sortBy: z
        .enum(["companyName", "dateJoined"])
        .optional()
        .default("dateJoined"),
      status: z.enum(["active", "inactive", "pending", "suspended"]).optional(),
    })
    .optional(),

  // Get all active companies
  getAllActive: z
    .object({
      searched: z.string().toLowerCase().optional().default(""),
      limit: z.number().default(10),
      page: z.number().default(1),
      sortBy: z
        .enum(["companyName", "dateJoined"])
        .optional()
        .default("dateJoined"),
    })
    .optional(),

  // Get companies by admin ID
  getByAdminId: z
    .object({
      companyAdminId: z.string().uuid({
        message: "Admin ID must be a valid UUID",
      }),
      limit: z.number().optional().default(10),
      page: z.number().optional().default(1),
      sortBy: z
        .enum(["companyName", "dateJoined"])
        .optional()
        .default("dateJoined"),
      status: z.enum(["active", "inactive", "pending", "suspended"]).optional(),
    })
    .optional(),

  // Update company
  update: updateCompanySchema,

  // Delete company
  delete: z.object({
    companyId: z.string().uuid({
      message: "Company ID must be a valid UUID",
    }),
  }),

  // disable company
  disable: z.object({
    companyId: z.string().uuid({
      message: "Company ID must be a valid UUID",
    }),
  }),
};

// Type for the unified schema
export interface CompanyRouterInput {
  create: z.infer<typeof companyRouterSchema.create>;
  getById: z.infer<typeof companyRouterSchema.getById>;
  getAll: z.infer<typeof companyRouterSchema.getAll>;
  getAllActive: z.infer<typeof companyRouterSchema.getAllActive>;
  getByAdminId: z.infer<typeof companyRouterSchema.getByAdminId>;
  update: z.infer<typeof companyRouterSchema.update>;
  delete: z.infer<typeof companyRouterSchema.delete>;
  disable: z.infer<typeof companyRouterSchema.disable>;
}

// Types for the schemas
export type CreateCompany = z.infer<typeof createCompanySchema>;
export type UpdateCompany = z.infer<typeof updateCompanySchema>;
export type BaseCompany = z.infer<typeof baseCompanyValidationSchema>;

// Type for company with admins
export interface CompanyWithAdmins {
  id: string;
  companyName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  dateJoined: Date | null;
  status: "active" | "inactive" | "suspended" | "pending" | null;
  lastActivity: Date | null;
  modifiedBy: string | null;
  employeeCount: number;
  reportCount: number;
  numOfEmployees: number;
  preferredSubscriptionPlan: string | null;
  admins: {
    id: string;
    userName: string;
    email: string;
  }[];
}

// Form values for the company form (for use in UI forms)
export interface CompanyFormValues {
  companyName: string;
  address?: string;
  phone?: string;
  email: string;
  adminIds: string[];
  companyId?: string;
  preferredSubscriptionPlan?: string;
}
