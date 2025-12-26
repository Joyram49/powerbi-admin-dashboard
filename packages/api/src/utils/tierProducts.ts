import { env } from "../../env";

export type Tier =
  | "data_foundation"
  | "insight_accelerator"
  | "strategic_navigator"
  | "enterprise";

interface TierConfig {
  name: string;
  recurringPriceId?: string;
  setupFeePriceId?: string;
  usagePriceId?: string;
  userLimit: number;
  custom?: boolean;
}

// Tier products configuration using environment variables
export const tierProducts: Record<Tier, TierConfig> = {
  data_foundation: {
    name: "Data Foundation",
    recurringPriceId: env.FOUNDATION_RECURRING_ID,
    setupFeePriceId: env.FOUNDATION_SETUP_ID,
    usagePriceId: env.USAGE_PRICE_ID,
    userLimit: env.FOUNDATION_LIMIT,
  },
  insight_accelerator: {
    name: "Insight Accelerator",
    recurringPriceId: env.INSIGHT_RECURRING_ID,
    setupFeePriceId: env.INSIGHT_SETUP_ID,
    usagePriceId: env.USAGE_PRICE_ID,
    userLimit: env.INSIGHT_LIMIT,
  },
  strategic_navigator: {
    name: "Strategic Navigator",
    recurringPriceId: env.STRATEGIC_RECURRING_ID,
    setupFeePriceId: env.STRATEGIC_SETUP_ID,
    usagePriceId: env.USAGE_PRICE_ID,
    userLimit: env.STRATEGIC_LIMIT,
  },
  enterprise: {
    name: "Enterprise",
    custom: true,
    userLimit: 0,
  },
};
