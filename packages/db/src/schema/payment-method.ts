import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { companies } from "./company";

export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  stripePaymentMethodId: varchar("stripe_payment_method_id", { length: 255 })
    .notNull()
    .unique(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, {
      onDelete: "set null",
    }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  paymentMethodType: varchar("payment_method_type", { length: 255 }),
  last4: varchar("last4", { length: 4 }),
  expMonth: integer("exp_month"),
  expYear: integer("exp_year"),
  isDefault: boolean("is_default").notNull().default(false),
  stripePortalUrl: text("stripe_portal_url"),
  dateCreated: timestamp("date_created", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const paymentMethodRouterSchema = {
  createPaymentMethod: z.object({
    stripePaymentMethodId: z.string(),
    companyId: z.string().uuid(),
    stripeCustomerId: z.string().optional(),
    type: z.string(),
    last4: z.string(),
    brand: z.string(),
    expMonth: z.number(),
    expYear: z.number(),
    isDefault: z.boolean().default(false),
  }),

  getPaymentMethods: z.object({
    companyId: z.string().uuid(),
  }),

  getPaymentMethodById: z.object({
    id: z.string().uuid(),
  }),

  updatePaymentMethod: z.object({
    id: z.string().uuid(),
    isDefault: z.boolean().optional(),
  }),

  deletePaymentMethod: z.object({
    id: z.string().uuid(),
  }),

  getDefaultPaymentMethod: z.object({
    companyId: z.string().uuid(),
  }),

  getPaymentMethodsByType: z.object({
    companyId: z.string().uuid(),
    type: z.string(),
  }),
};

export type PaymentMethod = typeof paymentMethods.$inferSelect;
