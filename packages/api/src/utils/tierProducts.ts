// lib/stripeProducts.ts

type Tier =
  | "data_foundation"
  | "insight_accelerator"
  | "strategic_navigator"
  | "enterprise";

interface TierConfig {
  name: string;
  recurringPriceId?: string;
  setupFeePriceId?: string;
  custom?: boolean;
}

// Update these with real Stripe Price IDs from your dashboard
export const tierProducts: Record<Tier, TierConfig> = {
  data_foundation: {
    name: "Data Foundation",
    recurringPriceId: "price_1RE3RB2KLgZYaaOjaRTP7jfw",
    setupFeePriceId: "price_1RE3Si2KLgZYaaOjrsJ72fd7",
  },
  insight_accelerator: {
    name: "Insight Accelerator",
    recurringPriceId: "price_1RE3TZ2KLgZYaaOjlPgbBRPG",
    setupFeePriceId: "price_1RE3UN2KLgZYaaOjaIsY6puy",
  },
  strategic_navigator: {
    name: "Strategic Navigator",
    recurringPriceId: "price_1RE3Ut2KLgZYaaOjKRN9SB44",
    setupFeePriceId: "price_1RE3VH2KLgZYaaOjAiEdjQ2P",
  },
  enterprise: {
    name: "Enterprise",
    custom: true,
  },
};
