import { defineConfig } from "drizzle-kit";

if (!process.env.POSTGRES_URL) {
  throw new Error("Missing POSTGRES_URL");
}

export default defineConfig({
  schema: [
    "./src/schema/company.ts",
    "./src/schema/user.ts",
    "./src/schema/post.ts",
  ],
  out: "./migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL,
  },
});
