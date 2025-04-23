import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  },

  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
    STRIPE_SECRET_KEY: z.string(),
  },

  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
    NEXT_PUBLIC_INACTIVITY_TIMEOUT: z.string().transform(Number).default("10"),
    NEXT_PUBLIC_APP_URL: z.string(),
  },

  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_INACTIVITY_TIMEOUT: process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
