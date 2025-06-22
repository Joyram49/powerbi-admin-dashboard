import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

export async function up(db: PostgresJsDatabase) {
  // First create the new enum type
  await db.execute(sql`
    CREATE TYPE "subscription_tier" AS ENUM (
      'data_foundation',
      'insight_accelerator',
      'strategic_navigator',
      'enterprise'
    );
  `);

  // Add the new column (it will be null by default for all existing rows)
  await db.execute(sql`
    ALTER TABLE "company" 
    ADD COLUMN "preferred_subscription_plan" "subscription_tier";
  `);

  // Remove the old column
  await db.execute(sql`
    ALTER TABLE "company" 
    DROP COLUMN "has_additional_user_purchase";
  `);
}

export async function down(db: PostgresJsDatabase) {
  // Add back the old column with default value
  await db.execute(sql`
    ALTER TABLE "company" 
    ADD COLUMN "has_additional_user_purchase" boolean NOT NULL DEFAULT false;
  `);

  // Remove the new column
  await db.execute(sql`
    ALTER TABLE "company" 
    DROP COLUMN "preferred_subscription_plan";
  `);

  // Drop the enum type
  await db.execute(sql`
    DROP TYPE "subscription_tier";
  `);
}
