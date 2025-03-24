import { interval, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { reports } from "./report";
import { users } from "./user";

export const userSessions = pgTable("user_sessions", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  totalActiveTime: interval("total_active_time"),
  totalInactiveTime: interval("total_inactive_time"),
  reportId: uuid("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "set null" }),
});

export type UserSession = typeof userSessions.$inferSelect;
