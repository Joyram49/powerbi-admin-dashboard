import { defineConfig } from "drizzle-kit";

if (!process.env.POSTGRES_URL) {
  throw new Error("Missing POSTGRES_URL");
}

export default defineConfig({
  schema: [
    "./src/schema/company.ts",
    "./src/schema/user.ts",
    "./src/schema/post.ts",
    "./src/schema/login-attempts.ts",
    "./src/schema/report.ts",
    "./src/schema/userReports.ts",
    "./src/schema/userSessions.ts",
    "./src/schema/report-metrics.ts",
    "./src/schema/mouse-activity.ts",
  ],
  out: "./migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL,
  },
});
