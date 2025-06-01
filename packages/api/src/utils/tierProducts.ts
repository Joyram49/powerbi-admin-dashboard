// lib/stripeProducts.ts

export type Tier =
  | "data_foundation"
  | "insight_accelerator"
  | "strategic_navigator"
  | "enterprise";

interface TierConfig {
  name: string;
  recurringPriceId?: string;
  setupFeePriceId?: string;
  usagePriceId?: string; // Price ID for overage usage
  userLimit: number;
  custom?: boolean;
}

// Update these with real Stripe Price IDs from your dashboard
export const tierProducts: Record<Tier, TierConfig> = {
  data_foundation: {
    name: "Data Foundation",
    recurringPriceId: "price_1RE3RB2KLgZYaaOjaRTP7jfw",
    setupFeePriceId: "price_1RE3Si2KLgZYaaOjrsJ72fd7",
    usagePriceId: "price_1RTfow2KLgZYaaOjCvA3VMkh", // Replace with actual Stripe Price ID
    userLimit: 2,
  },
  insight_accelerator: {
    name: "Insight Accelerator",
    recurringPriceId: "price_1RE3TZ2KLgZYaaOjlPgbBRPG",
    setupFeePriceId: "price_1RE3UN2KLgZYaaOjaIsY6puy",
    usagePriceId: "price_1RTfow2KLgZYaaOjCvA3VMkh", // Replace with actual Stripe Price ID
    userLimit: 6,
  },
  strategic_navigator: {
    name: "Strategic Navigator",
    recurringPriceId: "price_1RE3Ut2KLgZYaaOjKRN9SB44",
    setupFeePriceId: "price_1RE3VH2KLgZYaaOjAiEdjQ2P",
    usagePriceId: "price_1RTfow2KLgZYaaOjCvA3VMkh", // Replace with actual Stripe Price ID
    userLimit: 10,
  },
  enterprise: {
    name: "Enterprise",
    custom: true,
    userLimit: 0, // Custom limit for enterprise
  },
};
