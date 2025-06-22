import { defineConfig } from "drizzle-kit";

if (!process.env.POSTGRES_URL) {
  throw new Error("Missing POSTGRES_URL");
}

export default defineConfig({
  schema: [
    "./src/schema/company.ts",
    "./src/schema/user.ts",
    "./src/schema/login-attempts.ts",
    "./src/schema/report.ts",
    "./src/schema/userReports.ts",
    "./src/schema/userSessions.ts",
    "./src/schema/report-metrics.ts",
    "./src/schema/mouse-activity.ts",
    "./src/schema/billing.ts",
    "./src/schema/subscription.ts",
    "./src/schema/payment-method.ts",
    "./src/schema/company-admin-history.ts",
    "./src/schema/company-admin.ts",
  ],
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL,
  },
});
