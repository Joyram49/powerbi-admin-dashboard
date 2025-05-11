import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { companies } from "./company";
import { users } from "./user";

export const companyAdmins = pgTable("company_admin", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dateAssigned: timestamp("date_assigned", { withTimezone: true }).defaultNow(),
  modifiedBy: varchar("modified_by", { length: 255 }),
});

// Move type export **below** all schema definitions
export type CompanyAdmin = typeof companyAdmins.$inferSelect;
