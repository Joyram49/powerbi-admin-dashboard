import { relations } from "drizzle-orm";

import { billings } from "./billing";
import { companies } from "./company";
import { companyAdmins } from "./company-admin";
import { companyAdminHistory } from "./company-admin-history";
import { loginAttempts } from "./login-attempts";
import { mouseActivities } from "./mouse-activity";
import { paymentMethods } from "./payment-method";
import { reports } from "./report";
import { reportMetrics } from "./report-metrics";
import { subscriptions } from "./subscription";
import { users } from "./user";
import { userReports } from "./userReports";
import { userSessions } from "./userSessions";

export * from "./billing";
export * from "./company";
export * from "./company-admin";
export * from "./company-admin-history";
export * from "./login-attempts";
export * from "./mouse-activity";
export * from "./payment-method";
export * from "./report";
export * from "./report-metrics";
export * from "./subscription";
export * from "./user";
export * from "./userReports";
export * from "./userSessions";

// User relations
export const userRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  userReports: many(userReports),
  adminCompanies: many(companyAdmins), // New relation for admin companies
}));

// Company relations
export const companyRelations = relations(companies, ({ many }) => ({
  adminHistory: many(companyAdminHistory),
  employees: many(users),
  billings: many(billings),
  subscriptions: many(subscriptions),
  paymentMethods: many(paymentMethods),
  admins: many(companyAdmins), // New relation for company admins
}));

// Company Admin relations
export const companyAdminRelations = relations(companyAdmins, ({ one }) => ({
  company: one(companies, {
    fields: [companyAdmins.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [companyAdmins.userId],
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

// billing relations
export const billingRelations = relations(billings, ({ one }) => ({
  company: one(companies, {
    fields: [billings.companyId],
    references: [companies.id],
  }),
}));

// subscriptions relations
export const subscriptionReations = relations(subscriptions, ({ one }) => ({
  company: one(companies, {
    fields: [subscriptions.companyId],
    references: [companies.id],
  }),
}));

// payment methods relations
export const paymentMethodRelations = relations(paymentMethods, ({ one }) => ({
  company: one(companies, {
    fields: [paymentMethods.companyId],
    references: [companies.id],
  }),
}));

// Company Admin History relations
export const companyAdminHistoryRelations = relations(
  companyAdminHistory,
  ({ one }) => ({
    company: one(companies, {
      fields: [companyAdminHistory.companyId],
      references: [companies.id],
    }),
    previousAdmin: one(users, {
      fields: [companyAdminHistory.previousAdminId],
      references: [users.id],
    }),
    newAdmin: one(users, {
      fields: [companyAdminHistory.newAdminId],
      references: [users.id],
    }),
    changedByUser: one(users, {
      fields: [companyAdminHistory.changedBy],
      references: [users.id],
    }),
  }),
);
