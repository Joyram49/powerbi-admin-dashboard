import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "../../env";

// Define more specific types for cookie options
interface CustomCookieOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  expires?: Date;
}

interface StoredCookie {
  value: string;
  options: CustomCookieOptions;
}

// Global store for cookies with proper typing
export const globalCookieStore: Record<string, StoredCookie> = {};

// Create Supabase client for server auth
export function createClientServer() {
  try {
    const cookieStore = cookies();

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
              cookiesToSet.forEach(({ name, value, options }) => {
                // Set with minimal options to avoid conflicts
                cookieStore.set({
                  name,
                  value,
                  path: "/",
                  maxAge: 60 * 60 * 4, // hours
                });

                // Also manually store in a global for retrieval with proper typing
                const safeOptions: CustomCookieOptions = {
                  path: "/",
                  maxAge: 60 * 60 * 4,
                  // Only copy known safe properties from options
                  ...(options.path && { path: options.path }),
                  ...(options.domain && { domain: options.domain }),
                  ...(options.maxAge && { maxAge: options.maxAge }),
                  ...(options.httpOnly !== undefined && {
                    httpOnly: options.httpOnly,
                  }),
                  ...(options.secure !== undefined && {
                    secure: options.secure,
                  }),
                  ...(options.sameSite && {
                    sameSite: options.sameSite as "strict" | "lax" | "none",
                  }),
                  ...(options.expires && { expires: options.expires }),
                };

                globalCookieStore[name] = {
                  value,
                  options: safeOptions,
                };
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

// Create Supabase client for admin operations
export function createAdminClient() {
  try {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    }

    return createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // No-op for admin client
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  } catch (err) {
    console.error(
      "Error creating admin client:",
      err instanceof Error ? err.message : String(err),
    );
    throw new Error("Failed to create admin client");
  }
}
