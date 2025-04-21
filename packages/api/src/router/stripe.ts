import { z } from "zod";

import { stripe } from "../index";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { tierProducts } from "../utils/tierProducts";

// packages/api/src/router/billing.ts

export const stripeRouter = createTRPCRouter({
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        tier: z.enum([
          "data_foundation",
          "insight_accelerator",
          "strategic_navigator",
          "enterprise",
        ]),
        customerEmail: z.string().email(),
        customAmount: z.number().optional(),
        customSetupFee: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { tier, customerEmail, customAmount, customSetupFee } = input;
      const product = tierProducts[tier];

      if (!product.name) throw new Error("Invalid product tier");

      const line_items = [];

      if (product.custom) {
        if (!customAmount || !customSetupFee) {
          throw new Error("Missing pricing for enterprise tier");
        }

        const customRecurring = await stripe.prices.create({
          unit_amount: customAmount,
          currency: "usd",
          recurring: { interval: "month" },
          product_data: { name: "Enterprise Subscription" },
        });

        const customSetup = await stripe.prices.create({
          unit_amount: customSetupFee,
          currency: "usd",
          product_data: { name: "Enterprise Setup Fee" },
        });

        line_items.push(
          { price: customRecurring.id, quantity: 1 },
          { price: customSetup.id, quantity: 1 },
        );
      } else {
        line_items.push(
          { price: product.recurringPriceId, quantity: 1 },
          { price: product.setupFeePriceId, quantity: 1 },
        );
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
        customer_email: customerEmail,
        metadata: {
          tier,
        },
      });

      return { url: session.url };
    }),
});
