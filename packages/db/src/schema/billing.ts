import {
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { companies } from "./company";

export const billings = pgTable("billing", {
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
});

export const billingRouterSchema = {
  getAllBillings: z.object({
    search: z.string().optional(),
    limit: z.number().optional().default(10),
    page: z.number().optional().default(1),
    sortBy: z
      .enum([
        "old_to_new_billing",
        "new_to_old_billing",
        "high_to_low_amount",
        "low_to_high_amount",
      ])
      .optional()
      .default("new_to_old_billing"),
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
  }),

  getTotalRevenue: z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
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
