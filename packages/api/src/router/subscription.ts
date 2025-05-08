import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db, subscriptions } from "@acme/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const subscriptionRouter = createTRPCRouter({
  // Create a new subscription
  //   createSubscription: protectedProcedure
  //     .input(
  //       z.object({
  //         stripeSubscriptionId: z.string(),
  //         companyId: z.string().uuid(),
  //         stripeCustomerId: z.string().optional(),
  //         plan: z.string(),
  //         amount: z.number(),
  //         billingInterval: z.enum(["monthly", "yearly", "weekly", "daily"]),
  //         status: z.string(),
  //         userLimit: z.number(),
  //         currentPeriodEnd: z.date(),
  //         stripePortalUrl: z.string().optional(),
  //       }),
  //     )
  //     .mutation(async ({ input }) => {
  //       try {
  //         const [subscription] = await db
  //           .insert(subscriptions)
  //           .values({
  //             ...input,
  //             amount: input.amount,
  //             userLimit: input.userLimit,
  //           })
  //           .returning();
  //         return subscription;
  //       } catch (error) {
  //         throw new TRPCError({
  //           code: "INTERNAL_SERVER_ERROR",
  //           message:
  //             error instanceof Error
  //               ? error.message
  //               : "Failed to create subscription",
  //           cause: error,
  //         });
  //       }
  //     }),

  // Get subscription by company ID
  getCompanySubscription: protectedProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const subscription = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.companyId, input.companyId),
        });
        if (!subscription) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subscription not found",
          });
        }
        return subscription;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch company subscription",
          cause: error,
        });
      }
    }),

  // Get subscription by ID
  getSubscriptionById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const subscription = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.id, input.id),
        });
        if (!subscription) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subscription not found",
          });
        }
        return subscription;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch subscription",
          cause: error,
        });
      }
    }),

  // Update subscription
  //   updateSubscription: protectedProcedure
  //     .input(
  //       z.object({
  //         id: z.string().uuid(),
  //         status: z.string().optional(),
  //         amount: z.number().optional(),
  //         currentPeriodEnd: z.date().optional(),
  //         userLimit: z.number().optional(),
  //         stripePortalUrl: z.string().optional(),
  //       }),
  //     )
  //     .mutation(async ({ input }) => {
  //       try {
  //         const { id, ...updateData } = input;
  //         const [subscription] = await db
  //           .update(subscriptions)
  //           .set(updateData)
  //           .where(eq(subscriptions.id, id))
  //           .returning();
  //         if (!subscription) {
  //           throw new TRPCError({
  //             code: "NOT_FOUND",
  //             message: "Subscription not found",
  //           });
  //         }
  //         return subscription;
  //       } catch (error) {
  //         if (error instanceof TRPCError) throw error;
  //         throw new TRPCError({
  //           code: "INTERNAL_SERVER_ERROR",
  //           message:
  //             error instanceof Error
  //               ? error.message
  //               : "Failed to update subscription",
  //           cause: error,
  //         });
  //       }
  //     }),

  // Delete subscription
  deleteSubscription: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        const [subscription] = await db
          .delete(subscriptions)
          .where(eq(subscriptions.id, input.id))
          .returning();
        if (!subscription) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Subscription not found",
          });
        }
        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete subscription",
          cause: error,
        });
      }
    }),

  // Get subscriptions by status
  getSubscriptionsByStatus: protectedProcedure
    .input(z.object({ status: z.string() }))
    .query(async ({ input }) => {
      try {
        return await db.query.subscriptions.findMany({
          where: eq(subscriptions.status, input.status),
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch subscriptions by status",
          cause: error,
        });
      }
    }),

  // Get subscriptions by plan
  getSubscriptionsByPlan: protectedProcedure
    .input(z.object({ plan: z.string() }))
    .query(async ({ input }) => {
      try {
        return await db.query.subscriptions.findMany({
          where: eq(subscriptions.plan, input.plan),
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch subscriptions by plan",
          cause: error,
        });
      }
    }),
});
