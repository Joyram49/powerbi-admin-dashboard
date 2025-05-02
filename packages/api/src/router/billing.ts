import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { billings, db, paymentMethods, subscriptions } from "@acme/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const billingRouter = createTRPCRouter({
  // Create a new billing record
  createBilling: protectedProcedure
    .input(
      z.object({
        stripeInvoiceId: z.string(),
        companyId: z.string().uuid(),
        stripeCustomerId: z.string().optional(),
        billingDate: z.date(),
        status: z.string(),
        amount: z.number(),
        plan: z.string(),
        pdfLink: z.string().optional(),
        paymentStatus: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const [billing] = await db
          .insert(billings)
          .values({
            ...input,
            amount: input.amount.toString(),
          })
          .returning();
        return billing;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create billing record",
          cause: error,
        });
      }
    }),

  // Get all billing records for a company
  getCompanyBillings: protectedProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        return await db.query.billings.findMany({
          where: eq(billings.companyId, input.companyId),
          orderBy: (billings, { desc }) => [desc(billings.billingDate)],
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch company billings",
          cause: error,
        });
      }
    }),

  // Get a specific billing record
  getBillingById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
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
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.string().optional(),
        paymentStatus: z.string().optional(),
        pdfLink: z.string().optional(),
      }),
    )
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
    .input(z.object({ id: z.string().uuid() }))
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
    .input(
      z.object({
        companyId: z.string().uuid(),
        status: z.string(),
      }),
    )
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
    .input(
      z.object({
        companyId: z.string().uuid(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
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
    .input(z.object({ companyId: z.string().uuid() }))
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
});
