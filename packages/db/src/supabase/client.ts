import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../schema";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
  throw new Error("Missing SUPABASE_URL");
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!process.env.POSTGRES_URL) throw new Error("Missing POSTGRES_URL");

// Create Supabase client for auth
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

// Create postgres connection
const connectionString = process.env.POSTGRES_URL;
const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });
