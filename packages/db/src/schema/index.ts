import { relations } from "drizzle-orm";

import { companies } from "./company";
import { posts } from "./post";
import { users } from "./user";

export * from "./company";
export * from "./post";
export * from "./user";

// User relations
export const userRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  posts: many(posts), // A user can have multiple posts
}));

// Company relations
export const companyRelations = relations(companies, ({ one, many }) => ({
  admin: one(users, {
    fields: [companies.companyAdminId],
    references: [users.id], // Now users is fully loaded
  }),
  employees: many(users),
}));

// Post relations
export const postRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));
