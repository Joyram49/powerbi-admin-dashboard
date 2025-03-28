import { TRPCError } from "@trpc/server";
import { desc, eq, ilike } from "drizzle-orm";
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
        .object({
          searched: z.string().toLowerCase().optional().default(""),
          limit: z.number().default(10),
          page: z.number().default(1),
        })
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
      const { limit = 10, page = 1, searched = "" } = input ?? {};

      try {
        const totalCompanies = await db.$count(
          companies,
          ilike(companies.companyName, `%${searched}%`),
        );

        const allCompanies = await db.query.companies.findMany({
          where: ilike(companies.companyName, `%${searched}%`),
          limit: limit,
          offset: (page - 1) * limit,
          orderBy: [desc(companies.dateJoined)],
        });

        return {
          success: true,
          message: "Active companies fetched successfully",
          total: totalCompanies,
          limit,
          page,
          data: allCompanies,
        };
      } catch (error) {
        console.error("Error fetching companies:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  // get all active companies
  getAllActiveCompanies: protectedProcedure
    .input(
      z
        .object({ limit: z.number().default(10), page: z.number().default(1) })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to view active companies",
        });
      }

      const { limit = 10, page = 1 } = input ?? {};

      try {
        // Fetch total count only on the first page
        const totalCompanies = await db.$count(
          companies,
          eq(companies.status, "active"),
        );

        // Fetch paginated data
        const activeCompanies = await db.query.companies.findMany({
          with: {
            admin: true,
          },
          where: eq(companies.status, "active"),
          limit,
          offset: (page - 1) * limit,
          orderBy: [desc(companies.dateJoined)],
        });

        return {
          success: true,
          message: "Active companies fetched successfully",
          total: totalCompanies,
          limit,
          page,
          data: activeCompanies,
        };
      } catch (error) {
        console.error("Error fetching active companies:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
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
