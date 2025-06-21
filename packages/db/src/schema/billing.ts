import {
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { companies } from "./company";

export const billings = pgTable(
  "billing",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 })
      .notNull()
      .unique(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "set null",
      }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    billingDate: timestamp("billing_date", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 255 }).notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    plan: varchar("plan", { length: 255 }).notNull(),
    pdfLink: text("pdf_link"),
    paymentStatus: varchar("payment_status", { length: 255 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    dateCreated: timestamp("date_created", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Composite indexes for common query patterns
    companyStatusIdx: index("billing_company_status_idx").on(
      table.companyId,
      table.status,
    ),
    companyDateIdx: index("billing_company_date_idx").on(
      table.companyId,
      table.billingDate,
    ),
    statusDateIdx: index("billing_status_date_idx").on(
      table.status,
      table.billingDate,
    ),
    planStatusIdx: index("billing_plan_status_idx").on(
      table.plan,
      table.status,
    ),
    amountIdx: index("billing_amount_idx").on(table.amount),
    dateCreatedIdx: index("billing_date_created_idx").on(table.dateCreated),
    billingDateIdx: index("billing_billing_date_idx").on(table.billingDate),
    paymentStatusIdx: index("billing_payment_status_idx").on(
      table.paymentStatus,
    ),
  }),
);

export const billingRouterSchema = {
  getAllBillings: z
    .object({
      // Pagination
      limit: z.number().optional().default(10),
      page: z.number().optional().default(1),

      // Sorting
      sortBy: z
        .enum([
          "old_to_new_billing",
          "new_to_old_billing",
          "high_to_low_amount",
          "low_to_high_amount",
          "old_to_new_created",
          "new_to_old_created",
          "company_name_asc",
          "company_name_desc",
          "status_asc",
          "status_desc",
        ])
        .optional()
        .default("new_to_old_billing"),

      // Comprehensive filters object
      filters: z
        .object({
          // Search by company name
          search: z.string().optional(),

          // Status filters
          status: z.enum(["paid", "unpaid", "past_due", "failed"]).optional(),
          paymentStatus: z
            .enum(["paid", "unpaid", "past_due", "failed"])
            .optional(),

          // Plan filters
          plan: z
            .enum([
              "Data Foundation",
              "Strategic Navigator",
              "Insight Accelerator",
              "Enterprise",
              "overage usage",
            ])
            .optional(),

          // Company filters
          companyIds: z.array(z.string().uuid()).optional(),

          // Date range filters
          startDate: z.date().optional(),
          endDate: z.date().optional(),

          // Amount range filters
          minAmount: z.number().optional(),
          maxAmount: z.number().optional(),
        })
        .optional()
        .default({}),
    })
    .refine(
      (data) => {
        const { startDate, endDate } = data.filters;
        if (startDate && endDate) {
          return startDate <= endDate;
        }
        return true;
      },
      {
        message: "Start date must be before end date",
        path: ["filters", "startDate"],
      },
    )
    .refine(
      (data) => {
        const { minAmount, maxAmount } = data.filters;
        if (minAmount !== undefined && maxAmount !== undefined) {
          return minAmount <= maxAmount;
        }
        return true;
      },
      {
        message: "Minimum amount must be less than or equal to maximum amount",
        path: ["filters", "minAmount"],
      },
    ),

  getTotalRevenue: z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    status: z.enum(["paid", "unpaid", "past_due", "failed"]).optional(),
    plan: z
      .enum([
        "Data Foundation",
        "Strategic Navigator",
        "Insight Accelerator",
        "Enterprise",
        "overage usage",
      ])
      .optional(),
    companyIds: z.array(z.string().uuid()).optional(),
  }),

  getCompanyBillings: z.object({
    companyId: z.string().uuid(),
  }),

  getBillingById: z.object({
    id: z.string().uuid(),
  }),

  updateBilling: z.object({
    id: z.string().uuid(),
    status: z.string().optional(),
    paymentStatus: z.string().optional(),
    pdfLink: z.string().optional(),
  }),

  deleteBilling: z.object({
    id: z.string().uuid(),
  }),

  getBillingsByStatus: z.object({
    companyId: z.string().uuid(),
    status: z.string(),
  }),

  getBillingsByDateRange: z.object({
    companyId: z.string().uuid(),
    startDate: z.date(),
    endDate: z.date(),
  }),

  getCompanyBilling: z.object({
    companyId: z.string().uuid(),
  }),
};

export type Billing = typeof billings.$inferSelect;
