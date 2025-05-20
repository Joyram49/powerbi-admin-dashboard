import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { db, paymentMethods } from "@acme/db";
import { paymentMethodRouterSchema } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const paymentMethodRouter = createTRPCRouter({
  // Create a new payment method
  createPaymentMethod: protectedProcedure
    .input(paymentMethodRouterSchema.createPaymentMethod)
    .mutation(async ({ input }) => {
      try {
        const [paymentMethod] = await db
          .insert(paymentMethods)
          .values(input)
          .returning();
        return paymentMethod;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create payment method",
          cause: error,
        });
      }
    }),

  // Get payment methods by company ID
  getCompanyPaymentMethods: protectedProcedure
    .input(paymentMethodRouterSchema.getPaymentMethods)
    .query(async ({ input }) => {
      try {
        return await db.query.paymentMethods.findMany({
          where: eq(paymentMethods.companyId, input.companyId),
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch company payment methods",
          cause: error,
        });
      }
    }),

  // Get payment method by ID
  getPaymentMethodById: protectedProcedure
    .input(paymentMethodRouterSchema.getPaymentMethodById)
    .query(async ({ input }) => {
      try {
        const paymentMethod = await db.query.paymentMethods.findFirst({
          where: eq(paymentMethods.id, input.id),
        });
        if (!paymentMethod) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Payment method not found",
          });
        }
        return paymentMethod;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch payment method",
          cause: error,
        });
      }
    }),

  // Update payment method
  updatePaymentMethod: protectedProcedure
    .input(paymentMethodRouterSchema.updatePaymentMethod)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;
        const [paymentMethod] = await db
          .update(paymentMethods)
          .set(updateData)
          .where(eq(paymentMethods.id, id))
          .returning();
        if (!paymentMethod) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Payment method not found",
          });
        }
        return paymentMethod;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update payment method",
          cause: error,
        });
      }
    }),

  // Delete payment method
  deletePaymentMethod: protectedProcedure
    .input(paymentMethodRouterSchema.deletePaymentMethod)
    .mutation(async ({ input }) => {
      try {
        const [paymentMethod] = await db
          .delete(paymentMethods)
          .where(eq(paymentMethods.id, input.id))
          .returning();
        if (!paymentMethod) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Payment method not found",
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
              : "Failed to delete payment method",
          cause: error,
        });
      }
    }),

  // Get default payment method for company
  getDefaultPaymentMethod: protectedProcedure
    .input(paymentMethodRouterSchema.getDefaultPaymentMethod)
    .query(async ({ input }) => {
      try {
        const paymentMethod = await db.query.paymentMethods.findFirst({
          where: (paymentMethods, { and, eq }) =>
            and(
              eq(paymentMethods.companyId, input.companyId),
              eq(paymentMethods.isDefault, true),
            ),
        });
        if (!paymentMethod) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Default payment method not found",
          });
        }
        return paymentMethod;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch default payment method",
          cause: error,
        });
      }
    }),

  // Get payment methods by type
  getPaymentMethodsByType: protectedProcedure
    .input(paymentMethodRouterSchema.getPaymentMethodsByType)
    .query(async ({ input }) => {
      try {
        return await db.query.paymentMethods.findMany({
          where: (paymentMethods, { and, eq }) =>
            and(
              eq(paymentMethods.companyId, input.companyId),
              eq(paymentMethods.paymentMethodType, input.type),
            ),
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch payment methods by type",
          cause: error,
        });
      }
    }),
});
