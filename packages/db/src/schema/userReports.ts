import { pgTable, uuid } from "drizzle-orm/pg-core";

import { reports } from "./report";
import { users } from "./user";

export const userReports = pgTable("user_to_reports", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reportId: uuid("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
});
