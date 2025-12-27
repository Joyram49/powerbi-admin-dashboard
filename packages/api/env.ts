import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production"]).optional(),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    STRIPE_PRICE_ID: z.string().min(1).optional(),
    FOUNDATION_RECURRING_ID: z.string().min(1),
    FOUNDATION_SETUP_ID: z.string().min(1),
    FOUNDATION_LIMIT: z.string().transform(Number).pipe(z.number().min(1)),
    INSIGHT_RECURRING_ID: z.string().min(1),
    INSIGHT_SETUP_ID: z.string().min(1),
    INSIGHT_LIMIT: z.string().transform(Number).pipe(z.number().min(1)),
    STRATEGIC_RECURRING_ID: z.string().min(1),
    STRATEGIC_SETUP_ID: z.string().min(1),
    STRATEGIC_LIMIT: z.string().transform(Number).pipe(z.number().min(1)),
    USAGE_PRICE_ID: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().min(1),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
