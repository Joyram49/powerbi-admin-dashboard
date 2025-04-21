import { integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { reports } from "./report";
import { users } from "./user";

export const userSessions = pgTable("user_sessions", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(), // only one session per user

  startTime: timestamp("start_time", { withTimezone: true }).defaultNow(),
  endTime: timestamp("end_time", { withTimezone: true }),

  totalActiveTime: integer("total_active_time").default(0).notNull(), // in seconds
  totalInactiveTime: integer("total_inactive_time").default(0).notNull(), // in seconds

  reportId: uuid("report_id").references(() => reports.id, {
    onDelete: "set null",
  }),
});

export type UserSession = typeof userSessions.$inferSelect;
