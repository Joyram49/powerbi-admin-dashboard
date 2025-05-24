import type { SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";

import {
  companies,
  companyAdminHistory,
  companyAdminHistorySchema,
  companyAdmins,
  companyRouterSchema,
  db,
  users,
} from "@acme/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const companyRouter = createTRPCRouter({
  // Create company only for super admin
  create: protectedProcedure
    .input(companyRouterSchema.create)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to create a company",
        });
      }

      try {
        // Create new company
        const newCompany = await db
          .insert(companies)
          .values({
            companyName: input.companyName,
            address: input.address ?? null,
            phone: input.phone ?? null,
            email: input.email,
            modifiedBy: ctx.session.user.email,
          })
          .returning();

        const createdCompany = newCompany[0];
        if (!createdCompany?.id) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create company",
          });
        }

        // Add company admin relationships
        await Promise.allSettled(
          input.adminIds.map((adminId) =>
            Promise.all([
              db.insert(companyAdmins).values({
                companyId: createdCompany.id,
                userId: adminId,
                modifiedBy: ctx.session.user.email,
              }),
              db
                .update(users)
                .set({ companyId: createdCompany.id })
                .where(eq(users.id, adminId)),
            ]),
          ),
        );

        return {
          success: true,
          company: createdCompany,
        };
      } catch (error) {
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

  // Get all companies
  getAllCompanies: protectedProcedure
    .input(companyRouterSchema.getAll)
    .query(async ({ ctx, input }) => {
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
          where:
            whereConditions.length > 1
              ? and(...whereConditions)
              : whereConditions[0],
          with: {
            admins: {
              columns: {
                userId: true,
              },
              with: {
                user: {
                  columns: {
                    id: true,
                    userName: true,
                    email: true,
                  },
                },
              },
            },
          },
          extras: {
            employeeCount: sql<number>`(
              SELECT COUNT(*)::int FROM "user" u 
              WHERE u."company_id" = companies.id 
              AND NOT EXISTS (
                SELECT 1 FROM "company_admin" ca 
                WHERE ca."user_id" = u.id
              )
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

        // Transform the admin data structure
        const transformedCompanies = allCompanies.map((company) => ({
          ...company,
          admins: company.admins.map((admin) => ({
            id: admin.user.id,
            userName: admin.user.userName,
            email: admin.user.email,
          })),
        }));

        return {
          success: true,
          message: "Active companies fetched successfully",
          total: totalCompanies,
          limit,
          page,
          data: transformedCompanies,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  // Get all active companies
  getAllActiveCompanies: protectedProcedure
    .input(companyRouterSchema.getAllActive)
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
          where: and(
            eq(companies.status, "active"),
            ilike(companies.companyName, `%${searched}%`),
          ),
          with: {
            admins: {
              columns: {
                userId: true,
              },
              with: {
                user: {
                  columns: {
                    id: true,
                    userName: true,
                    email: true,
                  },
                },
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

        // Transform the admin data structure
        const transformedActiveCompanies = activeCompanies.map((company) => ({
          ...company,
          admins: company.admins.map((admin) => ({
            id: admin.user.id,
            userName: admin.user.userName,
            email: admin.user.email,
          })),
        }));

        return {
          success: true,
          message: "Active companies fetched successfully",
          total: totalCompanies,
          limit,
          page,
          data: transformedActiveCompanies,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // Get companies by admin ID
  getCompaniesByAdminId: protectedProcedure
    .input(companyRouterSchema.getByAdminId)
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
        const whereConditions: SQL[] = [];
        if (status) {
          whereConditions.push(eq(companies.status, status));
        }

        // Sorting logic
        const orderByCondition =
          sortBy === "companyName"
            ? [asc(companies.companyName)]
            : [desc(companies.dateJoined)];

        // First get all company IDs where the user is an admin
        const adminCompanies = await db.query.companyAdmins.findMany({
          where: eq(companyAdmins.userId, companyAdminId),
          columns: {
            companyId: true,
          },
        });

        const companyIds = adminCompanies.map((ac) => ac.companyId);

        if (companyIds.length === 0) {
          return {
            success: true,
            message: "No companies found for this admin",
            total: 0,
            limit,
            page,
            data: [],
          };
        }

        // Add company ID filter to where conditions
        whereConditions.push(inArray(companies.id, companyIds));

        // Fetch total count
        const totalCompanies = await db.$count(
          companies,
          and(...whereConditions),
        );

        // Fetch paginated and sorted data
        const companiesByAdminId = await db.query.companies.findMany({
          where: and(...whereConditions),
          with: {
            admins: {
              columns: {
                userId: true,
              },
              with: {
                user: {
                  columns: {
                    id: true,
                    userName: true,
                    email: true,
                  },
                },
              },
            },
          },
          extras: {
            employeeCount: sql<number>`(
              SELECT COUNT(*)::int FROM "user" WHERE "user"."company_id" = companies.id
            )`.as("employee_count"),
            reportCount: sql<number>`(
              SELECT COUNT(*)::int FROM "report" WHERE "report"."company_id" = companies.id
            )`.as("report_count"),
          },
          limit,
          offset: (page - 1) * limit,
          orderBy: orderByCondition,
        });

        // Transform the admin data structure
        const transformedCompaniesByAdminId = companiesByAdminId.map(
          (company) => ({
            ...company,
            admins: company.admins.map((admin) => ({
              id: admin.user.id,
              userName: admin.user.userName,
              email: admin.user.email,
            })),
          }),
        );

        return {
          success: true,
          message: "Companies fetched successfully",
          total: totalCompanies,
          limit,
          page,
          data: transformedCompaniesByAdminId,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // get all the admins of a company
  getAllAdminsOfACompany: protectedProcedure
    .input(companyRouterSchema.getById)
    .query(async ({ ctx, input }) => {
      const { companyId } = input;

      if (ctx.session.user.role === "user") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to view companies",
        });
      }

      try {
        const admins = await db.query.companyAdmins.findMany({
          where: eq(companyAdmins.companyId, companyId),
          with: {
            user: true,
          },
        });

        const transformedAdmins = admins.map((admin) => ({
          id: admin.user.id,
          userName: admin.user.userName,
          email: admin.user.email,
          role: admin.user.role,
          status: admin.user.status,
          dateCreated: admin.user.dateCreated,
          companyId: admin.user.companyId,
          lastLogin: admin.user.lastLogin,
          modifiedBy: admin.user.modifiedBy,
        }));

        return {
          success: true,
          message: "Admins fetched successfully",
          data: transformedAdmins,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // Get company by ID
  getCompanyByCompanyId: protectedProcedure
    .input(companyRouterSchema.getById)
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
          with: {
            admins: {
              columns: {
                userId: true,
              },
              with: {
                user: {
                  columns: {
                    id: true,
                    userName: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

        // Transform the admin data structure
        const transformedCompany = company
          ? {
              ...company,
              admins: company.admins.map((admin) => ({
                id: admin.user.id,
                userName: admin.user.userName,
                email: admin.user.email,
              })),
            }
          : null;

        return {
          success: true,
          message: "Company fetched successfully",
          data: transformedCompany,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // Update company
  updateCompany: protectedProcedure
    .input(companyRouterSchema.update)
    .mutation(async ({ ctx, input }) => {
      const { companyId, adminIds, ...rest } = input;

      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to update companies",
        });
      }

      try {
        // Get current company and admin data
        const currentCompany = await db.query.companies.findFirst({
          where: eq(companies.id, companyId),
          with: {
            admins: {
              columns: {
                userId: true,
              },
              with: {
                user: {
                  columns: {
                    id: true,
                    userName: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

        if (!currentCompany) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Company not found",
          });
        }

        // Update company details
        const updateData = Object.fromEntries(
          Object.entries({
            ...rest,
            modifiedBy: ctx.session.user.email,
            lastActivity: new Date(),
          }).filter(([_, value]) => value != null),
        );

        const updatedCompany = await db
          .update(companies)
          .set(updateData)
          .where(eq(companies.id, companyId))
          .returning();

        // Handle admin relationships if adminIds are provided
        if (adminIds) {
          const currentAdminIds = currentCompany.admins.map(
            (admin) => admin.userId,
          );
          const adminsToAdd = adminIds.filter(
            (id) => !currentAdminIds.includes(id),
          );
          const adminsToRemove = currentAdminIds.filter(
            (id) => !adminIds.includes(id),
          );

          // Remove old admin relationships
          if (adminsToRemove.length > 0) {
            await Promise.all([
              db
                .delete(companyAdmins)
                .where(
                  and(
                    eq(companyAdmins.companyId, companyId),
                    inArray(companyAdmins.userId, adminsToRemove),
                  ),
                ),
              db
                .update(users)
                .set({ companyId: null })
                .where(inArray(users.id, adminsToRemove)),
            ]);
          }

          // Add new admin relationships
          if (adminsToAdd.length > 0) {
            await Promise.all(
              adminsToAdd.map((userId) =>
                Promise.all([
                  db.insert(companyAdmins).values({
                    companyId,
                    userId,
                    modifiedBy: ctx.session.user.email,
                  }),
                  db
                    .update(users)
                    .set({ companyId })
                    .where(eq(users.id, userId)),
                ]),
              ),
            );
          }
        }

        return {
          success: true,
          message: "Company updated successfully",
          data: updatedCompany[0],
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // Delete company
  deleteCompany: protectedProcedure
    .input(companyRouterSchema.delete)
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
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // disable company
  disableACompany: protectedProcedure
    .input(companyRouterSchema.disable)
    .mutation(async ({ ctx, input }) => {
      const { companyId } = input;

      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to disable companies",
        });
      }

      try {
        await db
          .update(companies)
          .set({ status: "inactive" })
          .where(eq(companies.id, companyId));

        return {
          success: true,
          message: "Company disabled successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // enable company
  enableACompany: protectedProcedure
    .input(companyRouterSchema.disable)
    .mutation(async ({ ctx, input }) => {
      const { companyId } = input;

      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to enable companies",
        });
      }

      try {
        await db
          .update(companies)
          .set({ status: "active" })
          .where(eq(companies.id, companyId));

        return {
          success: true,
          message: "Company enabled successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // add company to the company admin history
  addCompanyToCompanyAdminHistory: protectedProcedure
    .input(companyAdminHistorySchema)
    .mutation(async ({ ctx, input }) => {
      const {
        companyId,
        changeType,
        changeReason,
        previousAdminId,
        previousAdminName,
        previousAdminEmail,
        newAdminId,
        newAdminName,
        newAdminEmail,
        previousCompanyName,
        newCompanyName,
        previousCompanyStatus,
        newCompanyStatus,
      } = input;

      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message:
            "You are not authorized to add company to the company admin history",
        });
      }

      try {
        // Create an object with only the required fields
        const baseValues = {
          companyId,
          changeType,
          previousAdminId,
          newAdminId,
          changedBy: ctx.session.user.id,
        };

        // Add optional fields only if they are provided
        const optionalValues = {
          ...(changeReason && { changeReason }),
          ...(previousAdminName && { previousAdminName }),
          ...(previousAdminEmail && { previousAdminEmail }),
          ...(newAdminName && { newAdminName }),
          ...(newAdminEmail && { newAdminEmail }),
          ...(previousCompanyName && { previousCompanyName }),
          ...(newCompanyName && { newCompanyName }),
          ...(previousCompanyStatus && { previousCompanyStatus }),
          ...(newCompanyStatus && { newCompanyStatus }),
        };

        await db.insert(companyAdminHistory).values({
          ...baseValues,
          ...optionalValues,
        });

        return {
          success: true,
          message: "Company added to the company admin history successfully",
        };
      } catch (error) {
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
