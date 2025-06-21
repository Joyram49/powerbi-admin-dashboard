import { TRPCError } from "@trpc/server";
import type { SQL } from "drizzle-orm";
import {
  and,
  asc,
  between,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
  sum,
} from "drizzle-orm";

import { billings, db, paymentMethods, subscriptions } from "@acme/db";
import { billingRouterSchema, companies } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const billingRouter = createTRPCRouter({
  // get all billings
  getAllBillings: protectedProcedure
    .input(billingRouterSchema.getAllBillings)
    .query(async ({ input }) => {
      try {
        const { limit, page, sortBy, filters = {} } = input;
        const {
          search,
          status,
          paymentStatus,
          plan,
          companyIds,
          startDate,
          endDate,
          minAmount,
          maxAmount,
        } = filters;

        const sqlFilters: SQL[] = [];

        // Get sort order based on the selected option - optimized for indexed columns
        const getSortOrder = () => {
          switch (sortBy) {
            case "old_to_new_billing":
              return asc(billings.billingDate);
            case "new_to_old_billing":
              return desc(billings.billingDate);
            case "high_to_low_amount":
              return desc(sql<number>`CAST(${billings.amount} AS FLOAT)`);
            case "low_to_high_amount":
              return asc(sql<number>`CAST(${billings.amount} AS FLOAT)`);
            case "old_to_new_created":
              return asc(billings.dateCreated);
            case "new_to_old_created":
              return desc(billings.dateCreated);
            case "company_name_asc":
              return asc(companies.companyName);
            case "company_name_desc":
              return desc(companies.companyName);
            case "status_asc":
              return asc(billings.status);
            case "status_desc":
              return desc(billings.status);
            default:
              return desc(billings.dateCreated);
          }
        };

        // Apply filters in order of selectivity (most selective first)
        // Status filter - very selective
        if (status) {
          sqlFilters.push(eq(billings.status, status));
        }

        // Payment status filter - very selective
        if (paymentStatus) {
          sqlFilters.push(eq(billings.paymentStatus, paymentStatus));
        }

        // Plan filter - selective
        if (plan) {
          sqlFilters.push(eq(billings.plan, plan));
        }

        // Company filter - very selective
        if (companyIds && companyIds.length > 0) {
          sqlFilters.push(inArray(billings.companyId, companyIds));
        }

        // Date filters - use indexed columns
        if (startDate && endDate) {
          sqlFilters.push(between(billings.billingDate, startDate, endDate));
        } else if (startDate) {
          sqlFilters.push(gte(billings.billingDate, startDate));
        } else if (endDate) {
          sqlFilters.push(lte(billings.billingDate, endDate));
        }

        // Amount filters - use indexed amount column
        if (minAmount !== undefined) {
          sqlFilters.push(
            gte(sql<number>`CAST(${billings.amount} AS FLOAT)`, minAmount),
          );
        }

        if (maxAmount !== undefined) {
          sqlFilters.push(
            lte(sql<number>`CAST(${billings.amount} AS FLOAT)`, maxAmount),
          );
        }

        // Build the where condition - optimize for indexed columns
        const whereCondition =
          sqlFilters.length > 0 ? and(...sqlFilters) : undefined;

        // Add search condition separately to avoid complex AND conditions
        const searchCondition = search
          ? ilike(companies.companyName, `%${search}%`)
          : undefined;

        // Combine conditions efficiently
        const finalWhereCondition =
          whereCondition && searchCondition
            ? and(whereCondition, searchCondition)
            : (whereCondition ?? searchCondition);

        // Execute queries with timeout protection and optimized structure
        const [totalResult, allBillings] = await Promise.all([
          // Count query - simplified for better performance
          db
            .select({ count: count() })
            .from(billings)
            .leftJoin(companies, eq(billings.companyId, companies.id))
            .where(finalWhereCondition ?? undefined),

          // Data query - optimized with proper indexing
          db
            .select({
              id: billings.id,
              invoiceId: billings.stripeInvoiceId,
              companyName: companies.companyName,
              billingDate: billings.billingDate,
              amount: sql<number>`CAST(${billings.amount} AS FLOAT)`,
              status: billings.status,
              paymentStatus: billings.paymentStatus,
              plan: billings.plan,
              pdfLink: billings.pdfLink,
              dateCreated: billings.dateCreated,
              updatedAt: billings.updatedAt,
            })
            .from(billings)
            .leftJoin(companies, eq(billings.companyId, companies.id))
            .where(finalWhereCondition ?? undefined)
            .limit(limit)
            .offset((page - 1) * limit)
            .orderBy(getSortOrder()),
        ]);

        return {
          message: "Billings fetched successfully",
          success: true,
          page,
          limit,
          data: allBillings,
          total: totalResult[0]?.count ?? 0,
        };
      } catch (error) {
        // Enhanced error handling for timeout issues
        if (error instanceof Error) {
          // Check for PostgreSQL timeout errors
          if (
            error.message.includes(
              "canceling statement due to statement timeout",
            ) ||
            error.message.includes("57014")
          ) {
            throw new TRPCError({
              code: "TIMEOUT",
              message:
                "Query timed out. Please try with more specific filters or contact support.",
              cause: error,
            });
          }

          // Check for other database-related errors
          if (
            error.message.includes("connection") ||
            error.message.includes("timeout")
          ) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Database connection issue. Please try again.",
              cause: error,
            });
          }
        }

        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to fetch billings",
          cause: error,
        });
      }
    }),

  // Get a specific billing record
  getBillingById: protectedProcedure
    .input(billingRouterSchema.getBillingById)
    .query(async ({ input }) => {
      try {
        const billing = await db.query.billings.findFirst({
          where: eq(billings.id, input.id),
        });
        if (!billing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Billing record not found",
          });
        }
        return billing;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch billing record",
          cause: error,
        });
      }
    }),

  // Update a billing record
  updateBilling: protectedProcedure
    .input(billingRouterSchema.updateBilling)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;
        const [billing] = await db
          .update(billings)
          .set(updateData)
          .where(eq(billings.id, id))
          .returning();
        if (!billing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Billing record not found",
          });
        }
        return billing;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update billing record",
          cause: error,
        });
      }
    }),

  // Delete a billing record
  deleteBilling: protectedProcedure
    .input(billingRouterSchema.deleteBilling)
    .mutation(async ({ input }) => {
      try {
        const [billing] = await db
          .delete(billings)
          .where(eq(billings.id, input.id))
          .returning();
        if (!billing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Billing record not found",
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
              : "Failed to delete billing record",
          cause: error,
        });
      }
    }),

  // Get billing records by status
  getBillingsByStatus: protectedProcedure
    .input(billingRouterSchema.getBillingsByStatus)
    .query(async ({ input }) => {
      try {
        return await db.query.billings.findMany({
          where: (billings, { and, eq }) =>
            and(
              eq(billings.companyId, input.companyId),
              eq(billings.status, input.status),
            ),
          orderBy: (billings, { desc }) => [desc(billings.billingDate)],
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch billings by status",
          cause: error,
        });
      }
    }),

  // Get billing records by date range
  getBillingsByDateRange: protectedProcedure
    .input(billingRouterSchema.getBillingsByDateRange)
    .query(async ({ input }) => {
      try {
        return await db.query.billings.findMany({
          where: (billings, { and, eq, gte, lte }) =>
            and(
              eq(billings.companyId, input.companyId),
              gte(billings.billingDate, input.startDate),
              lte(billings.billingDate, input.endDate),
            ),
          orderBy: (billings, { desc }) => [desc(billings.billingDate)],
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch billings by date range",
          cause: error,
        });
      }
    }),

  getCompanyBilling: protectedProcedure
    .input(billingRouterSchema.getCompanyBilling)
    .query(async ({ input }) => {
      try {
        const { companyId } = input;

        const billingRecords = await db.query.billings.findMany({
          where: eq(billings.companyId, companyId),
          orderBy: (billings, { desc }) => [desc(billings.billingDate)],
        });

        const subscription = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.companyId, companyId),
        });

        const paymentMethod = await db.query.paymentMethods.findFirst({
          where: eq(paymentMethods.companyId, companyId),
        });

        return {
          billingRecords,
          subscription,
          paymentMethod,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch company billing information",
          cause: error,
        });
      }
    }),

  // get total revenue where status is paid
  getTotalRevenue: protectedProcedure
    .input(billingRouterSchema.getTotalRevenue)
    .query(async ({ input }) => {
      try {
        const { startDate, endDate, status, plan, companyIds } = input;
        const filters: SQL[] = [];

        // Default to paid status if not specified
        if (status) {
          filters.push(eq(billings.status, status));
        } else {
          filters.push(eq(billings.status, "paid"));
        }

        // Add plan filter if provided
        if (plan) {
          filters.push(eq(billings.plan, plan));
        }

        // Add company filter if provided
        if (companyIds && companyIds.length > 0) {
          filters.push(inArray(billings.companyId, companyIds));
        }

        // Add date range filters if provided
        if (startDate) {
          filters.push(gte(billings.billingDate, startDate));
        }
        if (endDate) {
          // Set end date to end of day (23:59:59.999)
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          filters.push(lte(billings.billingDate, endOfDay));
        }

        const totalRevenue = await db
          .select({
            total: sql<number>`CAST(${sum(billings.amount)} AS FLOAT)`,
          })
          .from(billings)
          .where(and(...filters));

        return {
          message: "Total revenue fetched successfully",
          success: true,
          data: totalRevenue[0]?.total ?? 0,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch total revenue",
          cause: error,
        });
      }
    }),

  //  get outstanding invoices sum where status is unpaid
  getOutstandingInvoicesSum: protectedProcedure.query(async () => {
    try {
      // Use the status filter to leverage the status index
      const total = await db
        .select({
          total: sql<number>`CAST(${sum(billings.amount)} AS FLOAT)`,
        })
        .from(billings)
        .where(
          or(eq(billings.status, "unpaid"), eq(billings.status, "past_due")),
        );

      return {
        message: "Outstanding invoices sum fetched successfully",
        success: true,
        data: total[0]?.total ?? 0,
      };
    } catch (error) {
      // Enhanced error handling for timeout issues
      if (error instanceof Error) {
        if (
          error.message.includes(
            "canceling statement due to statement timeout",
          ) ||
          error.message.includes("57014")
        ) {
          throw new TRPCError({
            code: "TIMEOUT",
            message: "Outstanding invoices query timed out. Please try again.",
            cause: error,
          });
        }
      }

      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch outstanding invoices sum",
        cause: error,
      });
    }
  }),
});
