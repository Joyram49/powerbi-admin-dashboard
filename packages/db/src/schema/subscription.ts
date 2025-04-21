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

import { companies } from "./company";

export const billingIntervalEnum = pgEnum("billing_interval", [
  "monthly",
  "yearly",
  "weekly",
  "daily",
]);

export const subscriptions = pgTable("subscription", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
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
