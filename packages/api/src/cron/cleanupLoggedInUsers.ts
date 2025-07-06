import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from the root .env file FIRST
config({ path: resolve(process.cwd(), "../../.env") });

// Now import the modules after environment variables are loaded
async function main() {
  const { and, eq, lt } = await import("drizzle-orm");
  const cron = await import("node-cron");
  const { db, users } = await import("@acme/db");

  // Helper: get date 4 hours ago
  function fourHoursAgo(): Date {
    const d = new Date();
    d.setHours(d.getHours() - 4);
    return d;
  }

  // The cleanup function
  async function cleanupLoggedInUsers() {
    const threshold = fourHoursAgo();
    await db
      .update(users)
      .set({ isLoggedIn: false })
      .where(
        and(eq(users.isLoggedIn, true), lt(users.lastActivity, threshold)),
      );
    console.log(
      `[CRON] Cleaned up stale sessions at ${new Date().toISOString()}`,
    );
  }

  // Schedule: every 5 minutes
  cron.default.schedule("5 * * * *", async () => {
    await cleanupLoggedInUsers().catch(console.error);
  });

  // Run immediately on start
  await cleanupLoggedInUsers().catch(console.error);
}

main().catch(console.error);
