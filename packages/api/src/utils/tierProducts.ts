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
    recurringPriceId: "price_1XXXXX123DF_SUB",
    setupFeePriceId: "price_1XXXXX123DF_SETUP",
  },
  insight_accelerator: {
    name: "Insight Accelerator",
    recurringPriceId: "price_1XXXXX123IA_SUB",
    setupFeePriceId: "price_1XXXXX123IA_SETUP",
  },
  strategic_navigator: {
    name: "Strategic Navigator",
    recurringPriceId: "price_1XXXXX123SN_SUB",
    setupFeePriceId: "price_1XXXXX123SN_SETUP",
  },
  enterprise: {
    name: "Enterprise",
    custom: true,
  },
};
