import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { companies, db } from "@acme/db";

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
        companyId: z.string().uuid(),
        customAmount: z.number().optional(),
        customSetupFee: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { tier, customerEmail, customAmount, customSetupFee, companyId } =
        input;
      const product = tierProducts[tier];

      if (!product.name) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid product tier",
        });
      }

      // check if the company is inactive
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
      });

      if (company?.status === "inactive") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Company is inactive",
        });
      }

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

      try {
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items,
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
          customer_email: customerEmail,
          metadata: {
            tier: product.name,
            companyId,
          },
          subscription_data: {
            metadata: {
              tier: product.name,
              companyId,
            },
          },
        });

        return { url: session.url };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create checkout session",
        });
      }
    }),

  createPortalSession: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { customerId } = input;

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      });

      return { url: session.url };
    }),
});
