import type { SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
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
          sortBy: z
            .enum(["companyName", "dateJoined"])
            .optional()
            .default("dateJoined"),
          status: z
            .enum(["active", "inactive", "pending", "suspended"])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to view companies",
        });
      }

      const {
        limit = 10,
        page = 1,
        searched = "",
        sortBy = "dateJoined",
        status,
      } = input ?? {};

      try {
        // Constructing `where` conditions dynamically
        const whereConditions: SQL[] = [
          ilike(companies.companyName, `%${searched}%`),
        ];
        if (status) {
          whereConditions.push(eq(companies.status, status));
        }

        const totalCompanies = await db.$count(
          companies,
          and(...whereConditions),
        );

        // Dynamic Sorting
        const orderByCondition =
          sortBy === "companyName"
            ? [asc(companies.companyName)]
            : [desc(companies.dateJoined)];

        const allCompanies = await db.query.companies.findMany({
          columns: {
            companyAdminId: false,
          },
          where:
            whereConditions.length > 1
              ? and(...whereConditions)
              : whereConditions[0],
          with: {
            admin: {
              columns: {
                id: true,
                email: true,
                userName: true,
              },
            },
          },
          extras: {
            employeeCount: sql<number>`(
            SELECT COUNT(*)::int FROM "user" WHERE "user"."company_id" = companies.id
          )`.as("employee_count"),
            reportCount:
              sql<number>`(SELECT COUNT(*)::int FROM "report" WHERE "report"."company_id" = companies.id)`.as(
                "report_count",
              ),
          },
          limit: limit,
          offset: (page - 1) * limit,
          orderBy: orderByCondition,
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
        .object({
          searched: z.string().toLowerCase().optional().default(""),
          limit: z.number().default(10),
          page: z.number().default(1),
          sortBy: z
            .enum(["companyName", "dateJoined"])
            .optional()
            .default("dateJoined"),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to view active companies",
        });
      }

      const {
        limit = 10,
        page = 1,
        searched = "",
        sortBy = "dateJoined",
      } = input ?? {};

      try {
        // Sorting logic
        const orderByCondition =
          sortBy === "companyName"
            ? [asc(companies.companyName)]
            : [desc(companies.dateJoined)];

        // Fetch total count only on the first page
        const totalCompanies = await db.$count(
          companies,
          and(
            eq(companies.status, "active"),
            ilike(companies.companyName, `%${searched}%`),
          ),
        );

        // Fetch paginated data
        const activeCompanies = await db.query.companies.findMany({
          columns: {
            companyAdminId: false,
          },
          where: and(
            eq(companies.status, "active"),
            ilike(companies.companyName, `%${searched}%`),
          ),
          with: {
            admin: {
              columns: {
                id: true,
                email: true,
                userName: true,
              },
            },
          },
          extras: {
            employeeCount:
              sql<number>`(SELECT COUNT(*)::int FROM "user" WHERE "user"."company_id" = companies.id)`.as(
                "employee_count",
              ),
            reportCount:
              sql<number>`(SELECT COUNT(*)::int FROM "report" WHERE "report"."company_id" = companies.id)`.as(
                "report_count",
              ),
          },
          limit,
          offset: (page - 1) * limit,
          orderBy: orderByCondition,
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

  // get companies by company admin id
  getCompaniesByAdminId: protectedProcedure
    .input(
      z
        .object({
          companyAdminId: z.string().uuid(),
          limit: z.number().optional().default(10),
          page: z.number().optional().default(1),
          sortBy: z
            .enum(["companyName", "dateJoined"])
            .optional()
            .default("dateJoined"),
          status: z
            .enum(["active", "inactive", "pending", "suspended"])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const {
        companyAdminId,
        limit = 10,
        page = 1,
        sortBy = "dateJoined",
        status,
      } = input ?? {};

      if (ctx.session.user.role === "user") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to view companies",
        });
      }

      if (!companyAdminId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide company admin id",
        });
      }

      try {
        // Build where conditions dynamically
        const whereConditions: SQL[] = [
          eq(companies.companyAdminId, companyAdminId),
        ];
        if (status) {
          whereConditions.push(eq(companies.status, status));
        }

        // Sorting logic
        const orderByCondition =
          sortBy === "companyName"
            ? [asc(companies.companyName)]
            : [desc(companies.dateJoined)];

        // Fetch total count (only relevant for the first page)
        const totalCompanies = await db.$count(
          companies,
          and(...whereConditions),
        );

        // Fetch paginated and sorted data
        const companiesByAdminId = await db.query.companies.findMany({
          where: and(...whereConditions),
          extras: {
            employeeCount:
              sql<number>`(SELECT COUNT(*)::int FROM "user" WHERE "user"."company_id" = companies.id)`.as(
                "employee_count",
              ),
            reportCount:
              sql<number>`(SELECT COUNT(*)::int FROM "report" WHERE "report"."company_id" = companies.id)`.as(
                "report_count",
              ),
          },
          limit,
          offset: (page - 1) * limit,
          orderBy: orderByCondition,
        });

        return {
          success: true,
          message: "Companies fetched successfully",
          total: totalCompanies,
          limit,
          page,
          data: companiesByAdminId,
        };
      } catch (error) {
        console.error("Error fetching companies:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // get company by companyId
  getCompanyByCompanyId: protectedProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { companyId } = input;

      if (ctx.session.user.role === "user") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to view companies",
        });
      }
      try {
        const company = await db.query.companies.findFirst({
          where: eq(companies.id, companyId),
        });

        return {
          success: true,
          message: "Company fetched successfully",
          data: company,
        };
      } catch (error) {
        console.error("Error fetching company:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // update a company by companyId
  updateCompany: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        companyName: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        companyAdminId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { companyId, ...rest } = input;

      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to update companies",
        });
      }

      try {
        const updateData = Object.fromEntries(
          Object.entries({
            ...rest,
            modifiedBy: ctx.session.user.email,
            lastActivity: new Date(),
          }).filter(
            ([_, value]) =>
              value !== "" || value !== undefined || value !== null,
          ),
        );

        const updatedCompany = await db
          .update(companies)
          .set(updateData)
          .where(eq(companies.id, companyId))
          .returning();

        return {
          success: true,
          message: "Company updated successfully",
          data: updatedCompany[0],
        };
      } catch (error) {
        console.error("Error updating company:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // delete a company by companyId
  deleteCompany: protectedProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { companyId } = input;

      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to delete companies",
        });
      }

      try {
        await db.delete(companies).where(eq(companies.id, companyId));
        return {
          success: true,
          message: "Company deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting company:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),
});
