import type { Tier, TierConfig } from "./types";

export const tierProducts: Record<Tier, TierConfig> = {
  data_foundation: {
    name: "Data Foundation",
    userLimit: 2,
  },
  insight_accelerator: {
    name: "Insight Accelerator",
    userLimit: 6,
  },
  strategic_navigator: {
    name: "Strategic Navigator",
    userLimit: 10,
  },
  enterprise: {
    name: "Enterprise",
    userLimit: 0,
  },
} as const;
