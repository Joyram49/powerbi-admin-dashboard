import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { companies, db, subscriptions } from "@acme/db";

import { stripe } from "../index";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { generateTrialPeriod } from "../utils/generateTrialPeriod";
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
      const { tier, customerEmail, companyId, customAmount, customSetupFee } =
        input;

      try {
        // Get company details to check preferred subscription plan
        const company = await db.query.companies.findFirst({
          where: eq(companies.id, companyId),
        });

        if (!company) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Company not found",
          });
        }

        // If company has a preferred subscription plan, enforce it
        if (
          company.preferredSubscriptionPlan &&
          company.preferredSubscriptionPlan !== tier
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `This company can only subscribe to the ${company.preferredSubscriptionPlan} plan`,
          });
        }

        const product = tierProducts[tier];
        if (!product.name) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid product tier",
          });
        }

        // check if the company is inactive
        if (company.status === "inactive") {
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

          if (product.usagePriceId) {
            line_items.push({
              price: product.usagePriceId,
            });
          }
        }

        const trialEnd = generateTrialPeriod(new Date());

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
            trial_end: trialEnd,
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

  // Add new endpoint for handling user addition and overage
  handleUserAddition: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input }) => {
      const { companyId } = input;

      // Get company and subscription details
      const company = await db.query.companies.findFirst({
        where: eq(companies.id, companyId),
      });

      if (!company) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Company not found",
        });
      }

      const subscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.companyId, companyId),
      });

      if (!subscription?.stripeCustomerId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Subscription not found",
        });
      }

      // Get the current number of employees
      const currentEmployeeCount = company.numOfEmployees;
      const newEmployeeCount = currentEmployeeCount + 1;

      // Check if adding this user would exceed the plan limit
      if (newEmployeeCount > subscription.userLimit) {
        // Find the metered usage item in the subscription
        const stripeCustomerId = subscription.stripeCustomerId;
        // Report the overage using the new metered billing system
        const meterEvent = await stripe.billing.meterEvents.create({
          event_name: "user.overage",
          timestamp: Math.floor(Date.now() / 1000), // Current timestamp
          payload: {
            stripe_customer_id: stripeCustomerId,
            value: "1",
          },
        });

        console.log("meterEvent", meterEvent);

        if (!meterEvent.timestamp) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to report overage",
          });
        }
      }

      // Update the subscription with the overage user
      await db
        .update(subscriptions)
        .set({
          overageUser: subscription.overageUser + 1,
        })
        .where(
          eq(
            subscriptions.stripeSubscriptionId,
            subscription.stripeSubscriptionId,
          ),
        );

      return { success: true, newEmployeeCount };
    }),
});
