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
        const { search, limit, page, sortBy, status, plan } = input;
        const filters: SQL[] = [];

        // Get sort order based on the selected option
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
            default:
              return desc(billings.dateCreated);
          }
        };

        if (status) {
          filters.push(eq(billings.status, status));
        }

        if (plan) {
          filters.push(eq(billings.plan, plan));
        }

        // Get total count with company name search
        const total = await db
          .select({ count: count() })
          .from(billings)
          .leftJoin(companies, eq(billings.companyId, companies.id))
          .where(
            and(
              ...filters,
              search ? ilike(companies.companyName, `%${search}%`) : undefined,
            ),
          );

        // Get paginated results with company name search
        const allBillings = await db
          .select({
            id: billings.id,
            invoiceId: billings.stripeInvoiceId,
            companyName: companies.companyName,
            billingDate: billings.billingDate,
            amount: sql<number>`CAST(${billings.amount} AS FLOAT)`,
            status: billings.status,
            pdfLink: billings.pdfLink,
            dateCreated: billings.dateCreated,
            updatedAt: billings.updatedAt,
          })
          .from(billings)
          .leftJoin(companies, eq(billings.companyId, companies.id))
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
          message: "Billings fetched successfully",
          success: true,
          page,
          limit,
          data: allBillings,
          total: total[0]?.count ?? 0,
        };
      } catch (error) {
        console.log(error);
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
        const { startDate, endDate } = input;
        const filters: SQL[] = [eq(billings.status, "paid")];

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
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch outstanding invoices sum",
        cause: error,
      });
    }
  }),
});
