import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const companyStatus = pgEnum("company_status", [
  "active",
  "inactive",
  "pending",
  "suspended",
]);

export const companies = pgTable("company", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  dateJoined: timestamp("date_joined", { withTimezone: true }).defaultNow(),
  status: companyStatus("status").default("active"),
  lastActivity: timestamp("last_activity", { withTimezone: true }),
  modifiedBy: varchar("modified_by", { length: 255 }),
  numOfEmployees: integer("num_of_employees").notNull().default(0),
  hasAdditionalUserPurchase: boolean("has_additional_user_purchase").default(
    false,
  ),
});

// Move type export **below** all schema definitions
export type Company = typeof companies.$inferSelect;
