import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

export async function up(db: PostgresJsDatabase) {
  // Drop the post table
  await db.execute(sql`
    DROP TABLE IF EXISTS "post" CASCADE;
  `);
}

export async function down(db: PostgresJsDatabase) {
  // Recreate the post table if needed to rollback
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "post" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "title" varchar(256) NOT NULL,
      "content" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      "user_id" uuid REFERENCES "user"("id") ON DELETE CASCADE
    );
  `);
}
