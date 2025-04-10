import { createBrowserClient } from "@supabase/ssr";

import { env } from "../../env";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
  throw new Error("Missing SUPABASE_URL");
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");

// Create Supabase client for auth
export function createClientBrowser() {
  try {
    return createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  } catch (err) {
    console.error(
      "Error creating browser client:",
      err instanceof Error ? err.message : String(err),
    );
    throw new Error("Failed to create browser client");
  }
}
