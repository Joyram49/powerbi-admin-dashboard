import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { users } from "./user";
import { userSessions } from "./userSessions";

export const mouseActivities = pgTable("mouse_activity", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => userSessions.id, { onDelete: "set null" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mouseEventType: varchar("mouse_event_type").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export type MouseActivity = typeof mouseActivities.$inferSelect;
