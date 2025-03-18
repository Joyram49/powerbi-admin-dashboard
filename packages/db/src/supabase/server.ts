import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "../../env";

// Create Supabase client for server auth
export function createClientServer() {
  try {
    const cookieStore = cookies();

    // Debug: Check what cookies are available
    const allCookies = cookieStore.getAll();
    console.log(
      `Available cookies (${allCookies.length}):`,
      allCookies.map((c) => c.name).join(", "),
    );

    return createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              console.log(
                `Setting ${cookiesToSet.length} cookies:`,
                cookiesToSet.map((c) => c.value).join(", "),
              );

              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set({
                  name,
                  value,
                  ...options,
                  // Only use essential options to avoid conflicts
                  path: "/",
                  sameSite: "lax",
                  secure: false, // Works in both HTTP and HTTPS
                  httpOnly: false, // Allow JS access
                  maxAge: 60 * 60 * 24 * 30, // 30 days
                });
                console.log(`Set cookie: ${name} (length: ${value.length})`);
              });
            } catch (err) {
              console.error(
                "Error setting cookies:",
                err instanceof Error ? err.message : String(err),
              );
            }
          },
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    );
  } catch (err) {
    console.error(
      "Error creating server client:",
      err instanceof Error ? err.message : String(err),
    );
    throw new Error("Failed to create server client");
  }
}

// Helper function for server contexts where we can use next/headers
