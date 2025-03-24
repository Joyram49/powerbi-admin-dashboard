import { integer, interval, pgTable, uuid } from "drizzle-orm/pg-core";

import { mouseActivities } from "./mouse-activity";
import { users } from "./user";
import { userSessions } from "./userSessions";

export const reportMetrics = pgTable("report_metrics", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => userSessions.id, { onDelete: "set null" }),
  mouseActivityId: uuid("mouse_activity_id")
    .notNull()
    .references(() => mouseActivities.id, { onDelete: "set null" }),
  totalTimeSpent: interval("total_time_spent"),
  totalActiveTime: interval("total_active_time"),
  clickCount: integer("click_count").default(0),
});
