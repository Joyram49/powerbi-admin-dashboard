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

// this is from initial stripe product ids
// // Update these with real Stripe Price IDs from your dashboard
// export const tierProducts: Record<Tier, TierConfig> = {
//   data_foundation: {
//     name: "Data Foundation",
//     recurringPriceId: "price_1RE3RB2KLgZYaaOjaRTP7jfw",
//     setupFeePriceId: "price_1RE3Si2KLgZYaaOjrsJ72fd7",
//     usagePriceId: "price_1RTfow2KLgZYaaOjCvA3VMkh",
//     userLimit: 2,
//   },
//   insight_accelerator: {
//     name: "Insight Accelerator",
//     recurringPriceId: "price_1RE3TZ2KLgZYaaOjlPgbBRPG",
//     setupFeePriceId: "price_1RE3UN2KLgZYaaOjaIsY6puy",
//     usagePriceId: "price_1RTfow2KLgZYaaOjCvA3VMkh",
//     userLimit: 6,
//   },
//   strategic_navigator: {
//     name: "Strategic Navigator",
//     recurringPriceId: "price_1RE3Ut2KLgZYaaOjKRN9SB44",
//     setupFeePriceId: "price_1RE3VH2KLgZYaaOjAiEdjQ2P",
//     usagePriceId: "price_1RTfow2KLgZYaaOjCvA3VMkh",
//     userLimit: 10,
//   },
//   enterprise: {
//     name: "Enterprise",
//     custom: true,
//     userLimit: 0,
//   },
// };

// this is from yaser's stripe product ids
// Update these with real Stripe Price IDs from your dashboard
// export const tierProducts: Record<Tier, TierConfig> = {
//   data_foundation: {
//     name: "Data Foundation",
//     recurringPriceId: "price_1RdXWYRqTjUso32Xz2jbu30I",
//     setupFeePriceId: "price_1RdXVvRqTjUso32XsIPpxslb",
//     usagePriceId: "price_1RdnEHRqTjUso32X2toyISV4",
//     userLimit: 2,
//   },
//   insight_accelerator: {
//     name: "Insight Accelerator",
//     recurringPriceId: "price_1RdXdORqTjUso32XN69BRlRU",
//     setupFeePriceId: "price_1RdXbvRqTjUso32XDi6qSESA",
//     usagePriceId: "price_1RdnGHRqTjUso32XYUvmQute",
//     userLimit: 6,
//   },
//   strategic_navigator: {
//     name: "Strategic Navigator",
//     recurringPriceId: "price_1RdXewRqTjUso32XdTGBrXss",
//     setupFeePriceId: "price_1RdXeURqTjUso32XG4Cq8rUO",
//     usagePriceId: "price_1RdnHSRqTjUso32XHyrbAR0Z",
//     userLimit: 10,
//   },
//   enterprise: {
//     name: "Enterprise",
//     custom: true,
//     userLimit: 0,
//   },
// };

// this is from final stripe product ids
// Update these with real Stripe Price IDs from your dashboard
export const tierProducts: Record<Tier, TierConfig> = {
  data_foundation: {
    name: "Data Foundation",
    recurringPriceId: "price_1Rl3O7FwlRiNmUH37Jmt2Gm1",
    setupFeePriceId: "price_1Rl3NXFwlRiNmUH3xMNAnP2a",
    usagePriceId: "price_1Rl3RLFwlRiNmUH3i8sijYht",
    userLimit: 2,
  },
  insight_accelerator: {
    name: "Insight Accelerator",
    recurringPriceId: "price_1Rl3SjFwlRiNmUH3W9sSYkjp",
    setupFeePriceId: "price_1Rl3SQFwlRiNmUH3Wg4m7631",
    usagePriceId: "price_1Rl3TDFwlRiNmUH38bDT1JcE",
    userLimit: 6,
  },
  strategic_navigator: {
    name: "Strategic Navigator",
    recurringPriceId: "price_1Rl3U7FwlRiNmUH3JPnjF0g5",
    setupFeePriceId: "price_1Rl3TlFwlRiNmUH3x9bv0zrI",
    usagePriceId: "price_1Rl3UdFwlRiNmUH3wNVVOa90",
    userLimit: 10,
  },
  enterprise: {
    name: "Enterprise",
    custom: true,
    userLimit: 0,
  },
};
