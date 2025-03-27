import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { users } from "./user";

export const posts = pgTable("post", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
});

// Schema for creating posts - used in POST/PUT requests
export const createPostSchema = createInsertSchema(posts, {
  title: z.string().max(256),
  content: z.string(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
