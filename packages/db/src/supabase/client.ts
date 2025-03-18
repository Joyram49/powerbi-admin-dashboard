import { createBrowserClient } from "@supabase/ssr";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../../env";
import * as schema from "../schema";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
  throw new Error("Missing SUPABASE_URL");
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!process.env.POSTGRES_URL) throw new Error("Missing POSTGRES_URL");

// Create Supabase client for auth
export function createClientBrowser() {
  try {
    return createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        cookieOptions: {
          name: "sb-auth",
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          httpOnly: false, // Allow JavaScript access
        },
      },
    );
  } catch (err) {
    console.error(
      "Error creating browser client:",
      err instanceof Error ? err.message : String(err),
    );
    throw new Error("Failed to create browser client");
  }
}

// Create postgres connection
const connectionString = process.env.POSTGRES_URL;
const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });
