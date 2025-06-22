export const TIER_VALUES = [
  "data_foundation",
  "insight_accelerator",
  "strategic_navigator",
  "enterprise",
] as const;

export type Tier = (typeof TIER_VALUES)[number];

export interface TierConfig {
  name: string;
  userLimit: number;
}

export interface SubscriptionData {
  data: {
    plan: string;
  } | null;
  success: boolean;
  message: string;
}
