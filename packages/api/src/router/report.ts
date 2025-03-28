import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { companies, db, reports, userReports } from "@acme/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

const createReportSchema = z.object({
  reportName: z.string().min(3),
  reportUrl: z.string().url(),
  companyId: z.string().uuid(),
  userIds: z.array(z.string().uuid()),
});

export const reportRouter = createTRPCRouter({
  // this is the route for the super admin to create a report
  create: protectedProcedure
    .input(createReportSchema)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to create a report",
        });
      }
      const { reportName, reportUrl, companyId, userIds } = input;
      try {
        const [newReport] = await db
          .insert(reports)
          .values({
            reportName,
            reportUrl,
            companyId,
            modifiedBy: ctx.session.user.id,
          })
          .returning();

        if (!newReport?.id) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create report",
          });
        }

        // Insert multiple user-report associations
        if (userIds.length > 0) {
          await ctx.db.insert(userReports).values(
            userIds.map((userId) => ({
              userId,
              reportId: newReport.id,
            })),
          );
        }

        return { success: true, report: newReport };
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

  // this is the route for the super admin to get all reports
  getAllReports: protectedProcedure
    .input(
      z
        .object({
          searched: z.string().toLowerCase().optional().default(""),
          limit: z.number().optional().default(10),
          page: z.number().optional().default(1),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to get all reports",
        });
      }

      const { limit = 10, page = 1, searched = "" } = input ?? {};

      try {
        const totalReports = await db.$count(
          reports,
          ilike(reports.reportName, `%${searched}%`),
        );

        const reportsWithUserCounts = await db.query.reports.findMany({
          columns: {
            companyId: false,
          },
          where: ilike(reports.reportName, `%${searched}%`),
          with: {
            company: {
              columns: {
                id: true,
                companyName: true,
              },
            },
            userReports: {
              columns: {
                userId: true,
              },
            },
          },
          orderBy: desc(reports.dateCreated),
          limit,
          offset: (page - 1) * limit,
        });

        const formattedReports = reportsWithUserCounts.map(
          ({ userReports, ...report }) => ({
            ...report,
            userCounts: userReports.length,
          }),
        );

        return {
          success: true,
          message: "all reports fetched successfully",
          total: totalReports,
          limit,
          page,
          data: formattedReports,
        };
      } catch (error) {
        console.log(">>> error in getAllReports", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // this is the route for the admin to get all reports
  getAllReportsAdmin: protectedProcedure
    .input(
      z
        .object({
          searched: z.string().toLowerCase().optional().default(""),
          limit: z.number().optional().default(10),
          page: z.number().optional().default(1),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to get all reports",
        });
      }

      const { id: companyAdminId } = ctx.session.user;
      const { searched = "", limit = 10, page = 1 } = input ?? {};

      try {
        // Fetch all company IDs where the logged-in user is an admin
        const adminCompanies = await db.query.companies.findMany({
          where: eq(companies.companyAdminId, companyAdminId),
          columns: {
            id: true,
          },
        });

        const companyIds = adminCompanies.map((company) => company.id);

        if (companyIds.length === 0) {
          return {
            success: true,
            message: "No companies found",
            limit,
            page,
            total: 0,
            reports: [],
          };
        }

        // Get total report count for pagination
        const totalReports = await db.$count(
          reports,
          and(
            inArray(reports.companyId, companyIds),
            ilike(reports.reportName, `%${searched}%`),
          ),
        );

        // Fetch reports that belong to those companies
        const reportsWithUserCounts = await db.query.reports.findMany({
          where: and(
            inArray(reports.companyId, companyIds),
            ilike(reports.reportName, `%${searched}%`),
          ),
          with: {
            company: {
              columns: {
                id: true,
                companyName: true,
              },
            },
            userReports: {
              columns: {
                userId: true,
              },
            },
          },
          orderBy: desc(reports.dateCreated),
          limit,
          offset: (page - 1) * limit,
        });

        const formattedReports = reportsWithUserCounts.map(
          ({ userReports, ...report }) => ({
            ...report,
            userCounts: userReports.length,
          }),
        );

        return {
          success: true,
          message: "all reports fetched successfully",
          limit,
          page,
          total: totalReports,
          reports: formattedReports,
        };
      } catch (error) {
        console.log(">>> error in getAllReportsAdmin", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // this is the route for the user to get all reports
  getAllReportsUser: protectedProcedure
    .input(
      z
        .object({
          searched: z.string().toLowerCase().optional().default(""),
          limit: z.number().optional().default(10),
          page: z.number().optional().default(1),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "user") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to get all reports",
        });
      }

      const { searched = "", limit = 10, page = 1 } = input ?? {};

      const { id: userId } = ctx.session.user;

      try {
        const totalReports = await db.$count(
          reports,
          sql`${reports.id} IN (
            SELECT ${userReports.reportId} FROM ${userReports}
            WHERE ${userReports.userId} = ${userId}
          ) AND ${reports.reportName} ILIKE ${`%${searched}%`}`,
        );

        const reportsWithUser = await db.query.reports.findMany({
          where: sql`${reports.id} IN (
            SELECT ${userReports.reportId} FROM ${userReports}
            WHERE ${userReports.userId} = ${userId}
          ) AND ${reports.reportName} ILIKE ${`%${searched}%`}`,
          with: {
            company: {
              columns: {
                id: true,
                companyName: true,
              },
            },
            userReports: {
              columns: {
                userId: true,
              },
            },
          },
          orderBy: desc(reports.dateCreated),
          limit,
          offset: (page - 1) * limit,
        });

        const formattedReports = reportsWithUser.map(
          ({ userReports, ...report }) => ({
            ...report,
            userCounts: userReports.length,
          }),
        );

        return {
          success: true,
          message: "all reports fetched successfully",
          limit,
          page,
          total: totalReports,
          reports: formattedReports,
        };
      } catch (error) {
        console.log(">>> error in getAllReportsUser", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // this is the route for the super admin to get all reports for a company
  getAllReportsForCompany: protectedProcedure
    .input(
      z.object({
        companyId: z.string().uuid(),
        searched: z.string().optional().default(""),
        limit: z.number().default(10),
        page: z.number().default(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role === "user") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to get all reports for a company",
        });
      }

      const { companyId, searched, limit, page } = input;

      try {
        const totalReports = await db.$count(
          reports,
          and(
            eq(reports.companyId, companyId),
            ilike(reports.reportName, `%${searched}%`),
          ),
        );
        const allReports = await db.query.reports.findMany({
          where: and(
            eq(reports.companyId, companyId),
            ilike(reports.reportName, `%${searched}%`),
          ),
          with: {
            company: {
              columns: {
                id: true,
                companyName: true,
              },
            },
            userReports: {
              columns: {
                userId: true,
              },
            },
          },
          orderBy: desc(reports.dateCreated),
          limit,
          offset: (page - 1) * limit,
        });

        const formattedReports = allReports.map(
          ({ userReports, ...report }) => ({
            ...report,
            userCounts: userReports.length,
          }),
        );

        return {
          success: true,
          message: "all reports fetched successfully",
          limit,
          page,
          total: totalReports,
          reports: formattedReports,
        };
      } catch (error) {
        console.error("Error fetching reports for company:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // this is the route for the super admin to update a report
  updateReport: protectedProcedure
    .input(
      z.object({
        reportId: z.string().uuid(),
        reportName: z.string().min(3).optional().or(z.literal("")),
        reportUrl: z.string().url().optional().or(z.literal("")),
        companyId: z.string().uuid().optional().or(z.literal("")),
        accessCount: z.number().optional(),
        status: z.enum(["active", "inactive"]).optional(),
        userIds: z
          .array(z.string().uuid())
          .optional()
          .or(z.array(z.string().uuid()).length(0)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to update a report",
        });
      }

      const { reportId, userIds, ...rest } = input;

      // Build the update object dynamically
      const updateData = Object.fromEntries(
        Object.entries({
          ...rest,
          modifiedBy: ctx.session.user.id,
          lastModifiedAt: new Date(),
        }).filter(([_, value]) => value !== ""),
      );

      try {
        // Step 1: Update the reports table
        if (Object.keys(updateData).length > 0) {
          await db
            .update(reports)
            .set(updateData)
            .where(eq(reports.id, reportId));
        }

        // Step 2: Handle userReports (Many-to-Many Relation)
        if (userIds?.length) {
          // Delete existing relations for this report
          await db
            .delete(userReports)
            .where(eq(userReports.reportId, reportId));

          // Insert new user relations
          const newRelations = userIds.map((userId) => ({
            userId,
            reportId,
          }));
          await db.insert(userReports).values(newRelations);
        }

        return { success: true, message: "Report updated successfully" };
      } catch (error) {
        console.error("Error updating report:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // this is the route for the super admin to delete a report
  deleteReport: protectedProcedure
    .input(z.object({ reportId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to delete a report",
        });
      }

      const { reportId } = input;

      try {
        await db.delete(reports).where(eq(reports.id, reportId));
        return { success: true, message: "Report deleted successfully" };
      } catch (error) {
        console.error("Error deleting report:", error);
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
