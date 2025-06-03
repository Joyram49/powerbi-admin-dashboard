import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod";

import { companies } from "./company";

export const billingIntervalEnum = pgEnum("billing_interval", [
  "monthly",
  "yearly",
  "weekly",
  "daily",
]);

export const subscriptions = pgTable("subscription", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 })
    .notNull()
    .unique(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, {
      onDelete: "set null",
    }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  plan: varchar("plan", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  billingInterval: billingIntervalEnum("billing_interval").notNull(),
  status: varchar("status", { length: 255 }).notNull(),
  userLimit: integer("user_limit").notNull(),
  overageUser: integer("overage_user").notNull().default(0),
  currentPeriodEnd: timestamp("current_period_end", {
    withTimezone: true,
  }).notNull(),
  stripePortalUrl: text("stripe_portal_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  dateCreated: timestamp("date_created", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Subscription = typeof subscriptions.$inferSelect;

export const subscriptionRouterSchema = {
  getAllSubscriptions: z.object({
    search: z.string().optional(),
    limit: z.number().optional().default(10),
    page: z.number().optional().default(1),
    sortBy: z
      .enum([
        "old_to_new_date",
        "new_to_old_date",
        "high_to_low_overage",
        "low_to_high_overage",
      ])
      .optional()
      .default("new_to_old_date"),
    status: z.enum(["active", "inactive", "trialing", "canceled"]).optional(),
    plan: z
      .enum([
        "Data Foundation",
        "Strategic Navigator",
        "Insight Accelerator",
        "Enterprise",
      ])
      .optional(),
  }),

  getSubscriptionStatsByTimeframe: z.object({
    timeframe: z.enum(["1d", "7d", "1m", "3m", "6m", "1y"]),
    search: z.string().optional(),
    limit: z.number().optional().default(10),
    page: z.number().optional().default(1),
    sortBy: z
      .enum([
        "old_to_new_date",
        "new_to_old_date",
        "high_to_low_overage",
        "low_to_high_overage",
      ])
      .optional()
      .default("new_to_old_date"),
    status: z.enum(["active", "inactive", "trialing", "canceled"]).optional(),
    plan: z
      .enum([
        "Data Foundation",
        "Strategic Navigator",
        "Insight Accelerator",
        "Enterprise",
      ])
      .optional(),
  }),

  getCompanySubscription: z.object({
    companyId: z.string().uuid(),
  }),
  getSubscriptionById: z.object({
    id: z.string().uuid(),
  }),

  getSubscriptionsByPlan: z.object({
    plan: z.string(),
  }),
  getCurrentUserCompanySubscription: z.object({
    companyId: z.string().uuid(),
  }),
};
