import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

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

export type PaymentMethod = typeof paymentMethods.$inferSelect;
