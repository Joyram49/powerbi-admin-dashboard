import {
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

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

export type Billing = typeof billings.$inferSelect;
