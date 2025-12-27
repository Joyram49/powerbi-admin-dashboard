import { TRPCError } from "@trpc/server";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";

import { companies, db, subscriptions } from "@acme/db";

import type { Tier } from "../utils/tierProducts";
import { env } from "../../env";
import { stripe } from "../index";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { generateTrialPeriod } from "../utils/generateTrialPeriod";
import { tierProducts } from "../utils/tierProducts";

// packages/api/src/router/billing.ts

const baseUrl =
  env.NODE_ENV === "development"
    ? "http://localhost:3000/"
    : env.NEXT_PUBLIC_APP_URL;

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

        // check if the company is inactive
        if (company.status === "inactive") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Company is inactive",
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

        // check if the tier is valid
        const product = tierProducts[tier];
        if (!product.name) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid product tier",
          });
        }

        // check if the company has a subscription
        const subscription = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.companyId, companyId),
        });

        if (subscription) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Company already has a subscription",
          });
        }

        const line_items = [];

        if (product.custom) {
          if (!customAmount || !customSetupFee) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Missing pricing for enterprise tier",
            });
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
          line_items.push({ price: product.recurringPriceId, quantity: 1 });

          // Only add setup fee if company doesn't have a preferred subscription plan
          if (!company.preferredSubscriptionPlan) {
            line_items.push({ price: product.setupFeePriceId, quantity: 1 });
          }

          // company has prefferred subscription but also has build fee
          if (company.preferredSubscriptionPlan && company.isBuildFeeRequired) {
            line_items.push({ price: product.setupFeePriceId, quantity: 1 });
          }

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
          success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/cancel`,
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
        companyId: z.string().uuid(),
      }),
    )
    .mutation(async ({ input }) => {
      const { companyId } = input;

      try {
        // Get current subscription details
        const subscription = await db.query.subscriptions.findFirst({
          where: and(
            eq(subscriptions.companyId, companyId),
            or(
              eq(subscriptions.status, "active"),
              eq(subscriptions.status, "trialing"),
            ),
          ),
        });

        if (!subscription) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No active subscription found for this company",
          });
        }

        // Create a new portal configuration
        const configuration = await stripe.billingPortal.configurations.create({
          business_profile: {
            headline: "Manage your subscription",
          },
          features: {
            payment_method_update: {
              enabled: true,
            },
            customer_update: {
              enabled: true,
              allowed_updates: ["email", "address"],
            },
            invoice_history: {
              enabled: true,
            },
            subscription_cancel: {
              enabled: true,
              mode: "immediately",
            },
            subscription_pause: {
              enabled: false,
            },
            subscription_update: {
              enabled: false,
              default_allowed_updates: [],
              products: [],
            },
          },
        });

        if (!subscription.stripeCustomerId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No Stripe customer ID found for this subscription",
          });
        }

        // Create the portal session
        const session = await stripe.billingPortal.sessions.create({
          customer: subscription.stripeCustomerId,
          return_url: `${baseUrl}/billing`,
          configuration: configuration.id,
        });
        return { url: session.url };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create portal session",
        });
      }
    }),

  //  user addition and overage usage
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
          timestamp: Math.floor(Date.now() / 1000),
          payload: {
            stripe_customer_id: stripeCustomerId,
            value: "1",
          },
        });

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

  upgradeSubscription: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        newTier: z.enum([
          "data_foundation",
          "insight_accelerator",
          "strategic_navigator",
          "enterprise",
        ]),
      }),
    )
    .mutation(async ({ input }) => {
      const { companyId, newTier } = input;

      try {
        // Get current subscription
        const currentSubscription = await db.query.subscriptions.findFirst({
          where: and(
            eq(subscriptions.companyId, companyId),
            or(
              eq(subscriptions.status, "active"),
              eq(subscriptions.status, "trialing"),
            ),
          ),
        });

        if (!currentSubscription) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No active subscription found for this company",
          });
        }

        if (
          !currentSubscription.stripeCustomerId ||
          !currentSubscription.stripeSubscriptionId
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid subscription data",
          });
        }

        // Get current plan and new plan details
        const currentPlan = currentSubscription.plan
          .toLowerCase()
          .split(" ")
          .join("_") as Tier;
        const newPlan = tierProducts[newTier];

        // Check if the new plan is a custom plan
        if (newPlan.custom) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Custom plans are not supported for direct upgrades. Please contact support for enterprise pricing.",
          });
        }

        // Validate upgrade path
        const validUpgrades: Record<Tier, Tier[]> = {
          data_foundation: [
            "insight_accelerator",
            "strategic_navigator",
            "enterprise",
          ],
          insight_accelerator: ["strategic_navigator", "enterprise"],
          strategic_navigator: ["enterprise"],
          enterprise: [], // No upgrades allowed for enterprise
        };

        if (currentPlan === "enterprise") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Enterprise plans cannot be upgraded",
          });
        }

        if (!validUpgrades[currentPlan].includes(newTier)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Cannot upgrade from ${currentPlan} to ${newTier}`,
          });
        }

        // Get the current subscription from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(
          currentSubscription.stripeSubscriptionId,
        );

        // Check if subscription has items
        if (!stripeSubscription.items.data.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No subscription items found",
          });
        }

        const firstItem = stripeSubscription.items.data[0];
        if (!firstItem?.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid subscription item",
          });
        }

        // Update the subscription
        const updatedSubscription = await stripe.subscriptions.update(
          currentSubscription.stripeSubscriptionId,
          {
            items: [
              {
                id: firstItem.id,
                price: newPlan.recurringPriceId,
              },
            ],
            proration_behavior: "always_invoice",
            metadata: {
              tier: newPlan.name,
              companyId,
            },
          },
        );

        return {
          success: true,
          subscription: updatedSubscription,
          message:
            "Subscription upgrade request received. The changes will be applied at the end of your current billing period.",
        };
      } catch (error) {
        console.error("[Upgrade Subscription] Error:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upgrade subscription",
        });
      }
    }),
});
