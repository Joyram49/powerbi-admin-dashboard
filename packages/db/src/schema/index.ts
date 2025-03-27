import { relations } from "drizzle-orm";

import { companies } from "./company";
import { loginAttempts } from "./login-attempts";
import { mouseActivities } from "./mouse-activity";
import { posts } from "./post";
import { reports } from "./report";
import { reportMetrics } from "./report-metrics";
import { users } from "./user";
import { userReports } from "./userReports";
import { userSessions } from "./userSessions";

export * from "./company";
export * from "./login-attempts";
export * from "./mouse-activity";
export * from "./post";
export * from "./report";
export * from "./report-metrics";
export * from "./user";
export * from "./userReports";
export * from "./userSessions";

// User relations
export const userRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  posts: many(posts), // A user can have multiple posts
  userReports: many(userReports),
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

// login attempts relations
export const loginAttemptRelations = relations(loginAttempts, ({ one }) => ({
  user: one(users, {
    fields: [loginAttempts.email],
    references: [users.email],
  }),
}));

// reports relations
export const reportRelations = relations(reports, ({ one, many }) => ({
  company: one(companies, {
    fields: [reports.companyId],
    references: [companies.id],
  }),
  userReports: many(userReports),
}));

// userReports relations
export const userReportsRelations = relations(userReports, ({ one }) => ({
  user: one(users, {
    fields: [userReports.userId],
    references: [users.id],
  }),
  report: one(reports, {
    fields: [userReports.reportId],
    references: [reports.id],
  }),
}));

// userSessions relations
export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

// mouseActivities relations
export const mouseActivitiesRelations = relations(
  mouseActivities,
  ({ one }) => ({
    userSession: one(userSessions, {
      fields: [mouseActivities.sessionId],
      references: [userSessions.id],
    }),
    user: one(users, {
      fields: [mouseActivities.userId],
      references: [users.id],
    }),
  }),
);

// reportMetrics relations
export const reportMetricsRelations = relations(reportMetrics, ({ one }) => ({
  user: one(users, {
    fields: [reportMetrics.userId],
    references: [users.id],
  }),
  userSession: one(userSessions, {
    fields: [reportMetrics.sessionId],
    references: [userSessions.id],
  }),
  mouseActivity: one(mouseActivities, {
    fields: [reportMetrics.mouseActivityId],
    references: [mouseActivities.id],
  }),
}));
