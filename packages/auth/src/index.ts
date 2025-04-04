//create Supabase client for server side rendering
import { LRUCache } from "lru-cache";

import { createClientServer } from "@acme/db";

import { env } from "../env";

// Auth Cache
const authResultCache = new LRUCache<string, any>({
  max: 500, // Adjust based on expected traffic
  ttl: 1000 * 60 * 5, // 5 minutes cache
});

// Enhanced authentication helper functions with caching and error handling
export async function signUp(
  email: string,
  password: string,
  metadata?: Record<string, any>,
) {
  const cacheKey = `signup:${email}`;

  // Check cache first
  const cachedResult = authResultCache.get(cacheKey);
  if (cachedResult) return cachedResult;
  const supabase = createClientServer();

  try {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: env.NEXT_PUBLIC_APP_URL,
        data: metadata, // Optional metadata
      },
    });

    // Cache successful signup
    if (result.data.user) {
      authResultCache.set(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  const cacheKey = `signin:${email}`;

  // Check cache first
  const cachedResult = authResultCache.get(cacheKey);
  if (cachedResult) return cachedResult;
  const supabase = createClientServer();

  try {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Cache successful signin
    if (result.data.user) {
      authResultCache.set(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error("Signin error:", error);
    throw error;
  }
}

export async function signOut() {
  try {
    const supabase = createClientServer();
    const result = await supabase.auth.signOut();

    // Clear all cached auth results on signout
    authResultCache.clear();

    return result;
  } catch (error) {
    console.error("Signout error:", error);
    throw error;
  }
}

export async function getSession() {
  const cacheKey = "current-session";

  // Check cache first
  const cachedSession = authResultCache.get(cacheKey);
  if (cachedSession) return cachedSession;
  const supabase = createClientServer();

  try {
    const result = await supabase.auth.getSession();

    // Cache the session
    if (result.data.session) {
      authResultCache.set(cacheKey, result);
    }

    return result;
  } catch (error) {
    console.error("Get session error:", error);
    throw error;
  }
}

// Additional utility function for password reset
export async function resetPassword(email: string) {
  const supabase = createClientServer();
  try {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: env.NEXT_PUBLIC_APP_URL + "/reset-password",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    throw error;
  }
}

// Expose cache for manual management if needed
export const authCache = authResultCache;
