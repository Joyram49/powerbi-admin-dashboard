import type { SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
} from "drizzle-orm";

import {
  companies,
  db,
  subscriptionRouterSchema,
  subscriptions,
} from "@acme/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const subscriptionRouter = createTRPCRouter({
  // Get all subscriptions
  getAllSubscriptions: protectedProcedure
    .input(subscriptionRouterSchema.getAllSubscriptions)
    .query(async ({ input }) => {
      try {
        const { timeframe, search, limit, page, sortBy, status, plan } = input;
        const now = new Date();
        let startDate: Date | null;

        // Calculate start date based on timeframe
        switch (timeframe) {
          case "all":
            startDate = null; // No date filter for all time
            break;
          case "1d":
            startDate = new Date(now.setDate(now.getDate() - 1));
            break;
          case "7d":
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case "1m":
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case "3m":
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
          case "6m":
            startDate = new Date(now.setMonth(now.getMonth() - 6));
            break;
          case "1y":
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
          default:
            startDate = null; // Default to all time
        }

        const filters: SQL[] = [];

        // Add date filters only if timeframe is not "all"
        if (startDate) {
          filters.push(gte(subscriptions.dateCreated, startDate));
          filters.push(lte(subscriptions.dateCreated, new Date()));
        }

        // Add status filter if provided
        if (status) {
          filters.push(eq(subscriptions.status, status));
        }

        // Add plan filter if provided
        if (plan) {
          filters.push(eq(subscriptions.plan, plan));
        }

        // Get sort order based on the selected option
        const getSortOrder = () => {
          switch (sortBy) {
            case "old_to_new_date":
              return asc(subscriptions.dateCreated);
            case "new_to_old_date":
              return desc(subscriptions.dateCreated);
            case "high_to_low_overage":
              return desc(subscriptions.overageUser);
            case "low_to_high_overage":
              return asc(subscriptions.overageUser);
            default:
              return desc(subscriptions.dateCreated);
          }
        };

        // Get total count with company name search
        const total = await db
          .select({ count: count() })
          .from(subscriptions)
          .leftJoin(companies, eq(subscriptions.companyId, companies.id))
          .where(
            and(
              ...filters,
              search ? ilike(companies.companyName, `%${search}%`) : undefined,
            ),
          );

        // Get paginated results with company name search
        const subscriptionsData = await db
          .select({
            id: subscriptions.id,
            stripeSubscriptionId: subscriptions.stripeSubscriptionId,
            companyName: companies.companyName,
            plan: subscriptions.plan,
            amount: sql<number>`CAST(${subscriptions.amount} AS FLOAT)`,
            billingInterval: subscriptions.billingInterval,
            status: subscriptions.status,
            userLimit: subscriptions.userLimit,
            overageUser: subscriptions.overageUser,
            currentPeriodEnd: subscriptions.currentPeriodEnd,
            dateCreated: subscriptions.dateCreated,
            updatedAt: subscriptions.updatedAt,
          })
          .from(subscriptions)
          .leftJoin(companies, eq(subscriptions.companyId, companies.id))
          .where(
            and(
              ...filters,
              search ? ilike(companies.companyName, `%${search}%`) : undefined,
            ),
          )
          .limit(limit)
          .offset((page - 1) * limit)
          .orderBy(getSortOrder());

        return {
          success: true,
          message:
            timeframe === "all"
              ? "All subscriptions fetched successfully"
              : `Subscription stats for ${timeframe} fetched successfully`,
          total: total[0]?.count ?? 0,
          limit,
          page,
          data: {
            timeframe,
            startDate,
            endDate: new Date(),
            subscriptions: subscriptionsData,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch subscription stats",
          cause: error,
        });
      }
    }),
  // Get subscription by company ID
  getCompanySubscription: protectedProcedure
    .input(subscriptionRouterSchema.getCompanySubscription)
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
        return {
          success: true,
          message: "Subscription for company fetched successfully",
          data: subscription,
        };
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
    .input(subscriptionRouterSchema.getSubscriptionById)
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
        return {
          success: true,
          message: "Subscription fetched successfully",
          data: subscription,
        };
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

  // Get subscriptions by plan
  getSubscriptionsByPlan: protectedProcedure
    .input(subscriptionRouterSchema.getSubscriptionsByPlan)
    .query(async ({ input }) => {
      try {
        const subscriptionByPlan = await db.query.subscriptions.findMany({
          where: eq(subscriptions.plan, input.plan),
        });
        return {
          success: true,
          message: "Subscriptions by plan fetched successfully",
          data: subscriptionByPlan,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
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

  getCurrentUserCompanySubscription: protectedProcedure
    .input(subscriptionRouterSchema.getCurrentUserCompanySubscription)
    .query(async ({ input }) => {
      const { companyId } = input;

      try {
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
          return {
            success: true,
            message: "No subscription found for this company",
            data: null,
          };
        }

        return {
          success: true,
          message: "Current user company subscription fetched successfully",
          data: subscription,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch company subscription",
        });
      }
    }),
});
