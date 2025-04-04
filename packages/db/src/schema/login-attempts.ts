import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const loginAttempts = pgTable("login_attempts", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  attempts: integer("attempts").notNull().default(0),
  lastAttempt: timestamp("last_attempt", { withTimezone: true }).defaultNow(),
  isLocked: boolean("is_locked").notNull().default(false),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const createLoginAttemptSchema = createInsertSchema(loginAttempts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type NewLoginAttempt = typeof loginAttempts.$inferInsert;
