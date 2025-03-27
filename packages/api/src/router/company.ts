import { TRPCError } from "@trpc/server";
import { ilike } from "drizzle-orm";
import { z } from "zod";

import { companies, db } from "@acme/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

const createCompanySchema = z.object({
  companyName: z.string().min(3),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }),
  companyAdminId: z.string().uuid(),
});

export const companyRouter = createTRPCRouter({
  // crete company only for super admin
  create: protectedProcedure
    .input(createCompanySchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to create a company",
        });
      }

      try {
        // Create new company with the provided admin ID
        const newCompany = await db
          .insert(companies)
          .values({
            companyName: input.companyName,
            address: input.address ?? null,
            phone: input.phone ?? null,
            email: input.email,
            companyAdminId: input.companyAdminId,
            modifiedBy: ctx.session.user.email,
          })
          .returning();

        return {
          success: true,
          company: newCompany[0],
        };
      } catch (error) {
        console.error("Error creating company:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to create company",
        });
      }
    }),

  // get all the searched companies for super admin
  getAllCompanies: protectedProcedure
    .input(
      z
        .object({ searched: z.string().toLowerCase().optional().default("") })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view companies",
        });
      }

      const searched = input?.searched ?? "";

      try {
        const allCompanies = await db
          .select()
          .from(companies)
          .where(ilike(companies.companyName, `%${searched}%`))
          .limit(50);

        return {
          success: true,
          companies: allCompanies,
        };
      } catch (error) {
        console.error("Error fetching companies:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  //   getById: protectedProcedure
  //     .input(z.object({ id: z.string().uuid() }))
  //     .query(async ({ ctx, input }) => {
  //       // Ensure user is authenticated
  //       if (!ctx.session.user.id) {
  //         throw new TRPCError({
  //           code: "UNAUTHORIZED",
  //           message: "You must be logged in to view company details",
  //         });
  //       }

  //       try {
  //         const company = await db
  //           .select()
  //           .from(companies)
  //           .where(companies.id.eq(input.id))
  //           .limit(1);

  //         if (!company || company.length === 0) {
  //           return {
  //             success: false,
  //             error: "Company not found",
  //           };
  //         }

  //         return {
  //           success: true,
  //           company: company[0],
  //         };
  //       } catch (error) {
  //         console.error("Error fetching company:", error);
  //         return {
  //           success: false,
  //           error: error instanceof Error ? error.message : "Unknown error",
  //         };
  //       }
  //     }),
});
