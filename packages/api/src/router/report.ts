import type { SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { companies, companyAdmins, db, reports, userReports } from "@acme/db";
import { reportRouterSchema } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const reportRouter = createTRPCRouter({
  // this is the route for the super admin to create a report
  create: protectedProcedure
    .input(reportRouterSchema.create)
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

        return {
          success: true,
          message: "Report created successfully",
          report: newReport,
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

  // this is the route for the super admin to get all reports
  getAllReports: protectedProcedure
    .input(reportRouterSchema.getAllReports)
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to get all reports",
        });
      }

      const {
        limit = 10,
        page = 1,
        searched = "",
        sortBy = "dateCreated",
        status,
      } = input ?? {};

      try {
        // Constructing `where` conditions dynamically
        const whereConditions: SQL[] = [
          ilike(reports.reportName, `%${searched}%`),
        ];
        if (status) {
          whereConditions.push(eq(reports.status, status));
        }

        const totalReports = await db.$count(reports, and(...whereConditions));

        // Dynamic Sorting
        const orderByCondition =
          sortBy === "reportName"
            ? [asc(reports.reportName)]
            : [desc(reports.dateCreated)];

        const reportsWithUserCounts = await db.query.reports.findMany({
          columns: {
            companyId: false,
          },
          with: {
            company: {
              columns: {
                id: true,
                companyName: true,
              },
            },
          },
          extras: {
            userCounts:
              sql<number>`(SELECT COUNT(*)::int FROM "user_to_reports" WHERE "user_to_reports"."report_id" = reports.id)`.as(
                "user_counts",
              ),
          },
          where: and(...whereConditions),
          orderBy: orderByCondition,
          limit,
          offset: (page - 1) * limit,
        });

        return {
          success: true,
          message: "all reports fetched successfully",
          total: totalReports,
          limit,
          page,
          data: reportsWithUserCounts,
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

  // this is the route for the admin to get all reports
  getAllReportsAdmin: protectedProcedure
    .input(reportRouterSchema.getAllReportsAdmin)
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to get all reports",
        });
      }

      const { id: companyAdminId } = ctx.session.user;
      const {
        limit = 10,
        page = 1,
        searched = "",
        sortBy = "dateCreated",
      } = input ?? {};

      try {
        // Fetch all company IDs where the logged-in user is an admin
        const adminCompanies = await db.query.companyAdmins.findMany({
          where: eq(companyAdmins.userId, companyAdminId),
          columns: {
            companyId: true,
          },
        });

        const companyIds = adminCompanies.map((company) => company.companyId);

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

        // Dynamic Sorting
        const orderByCondition =
          sortBy === "reportName"
            ? [asc(reports.reportName)]
            : [desc(reports.dateCreated)];

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
          },
          extras: {
            userCounts:
              sql<number>`(SELECT COUNT(*)::int FROM "user_to_reports" WHERE "user_to_reports"."report_id" = reports.id)`.as(
                "user_counts",
              ),
          },
          limit,
          offset: (page - 1) * limit,
          orderBy: orderByCondition,
        });

        return {
          success: true,
          message: "all reports fetched successfully",
          limit,
          page,
          total: totalReports,
          reports: reportsWithUserCounts,
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

  // this is the route for the user to get all reports
  getAllReportsUser: protectedProcedure
    .input(reportRouterSchema.getAllReportsUser)
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
        const searchCondition = searched
          ? ilike(reports.reportName, `%${searched}%`)
          : undefined;

        // Fetch total reports count with search condition
        const totalReports = await db
          .select({ count: count() })
          .from(reports)
          .innerJoin(userReports, eq(userReports.reportId, reports.id))
          .where(
            searchCondition
              ? and(eq(userReports.userId, userId), searchCondition)
              : eq(userReports.userId, userId),
          )
          .execute();

        const reportsWithUserCounts = await db
          .select({
            id: reports.id,
            reportName: reports.reportName,
            dateCreated: reports.dateCreated,
            modifiedBy: reports.modifiedBy,
            lastModifiedAt: reports.lastModifiedAt,
            status: reports.status,
            reportUrl: reports.reportUrl,
            accessCount: reports.accessCount,
            userCounts: db.$count(
              userReports,
              eq(userReports.reportId, reports.id),
            ),
            company: {
              id: companies.id,
              companyName: companies.companyName,
            },
          })
          .from(reports)
          .innerJoin(companies, eq(reports.companyId, companies.id))
          .leftJoin(userReports, eq(userReports.reportId, reports.id))
          .where(
            searchCondition
              ? and(eq(userReports.userId, userId), searchCondition)
              : eq(userReports.userId, userId),
          )
          .groupBy(reports.id, companies.id)
          .orderBy(desc(reports.dateCreated))
          .limit(limit)
          .offset((page - 1) * limit)
          .execute();

        return {
          success: true,
          message: "All reports fetched successfully",
          limit,
          page,
          total: totalReports[0]?.count,
          reports: reportsWithUserCounts,
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

  // this is the route for the super admin to get all reports for a company by company id
  getAllReportsForCompany: protectedProcedure
    .input(reportRouterSchema.getAllReportsForCompany)
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role === "user") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view company reports",
        });
      }

      const { companyId, limit = 10, page = 1, searched = "" } = input;

      try {
        // Build where conditions
        const whereConditions = [eq(reports.companyId, companyId)];

        if (searched) {
          whereConditions.push(ilike(reports.reportName, `%${searched}%`));
        }

        const totalReports = await db.$count(
          reports,
          whereConditions.length > 1
            ? and(...whereConditions)
            : whereConditions[0],
        );

        const reportsWithUserCounts = await db
          .select({
            id: reports.id,
            reportName: reports.reportName,
            dateCreated: reports.dateCreated,
            modifiedBy: reports.modifiedBy,
            lastModifiedAt: reports.lastModifiedAt,
            status: reports.status,
            reportUrl: reports.reportUrl,
            accessCount: reports.accessCount,
            userCounts: db.$count(
              userReports,
              eq(userReports.reportId, reports.id),
            ),
            company: {
              id: companies.id,
              companyName: companies.companyName,
            },
          })
          .from(reports)
          .innerJoin(companies, eq(reports.companyId, companies.id))
          .leftJoin(userReports, eq(userReports.reportId, reports.id))
          .where(
            whereConditions.length > 1
              ? and(...whereConditions)
              : whereConditions[0],
          )
          .groupBy(reports.id, companies.id)
          .orderBy(desc(reports.dateCreated))
          .limit(limit)
          .offset((page - 1) * limit)
          .execute();

        return {
          success: true,
          message: "Company reports fetched successfully",
          total: totalReports,
          limit,
          page,
          reports: reportsWithUserCounts,
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

  // this is the route for all type of users to get report by report id
  getReportById: protectedProcedure
    .input(reportRouterSchema.getReportById)
    .query(async ({ ctx, input }) => {
      const { reportId } = input;
      const { id: userId, role: userRole } = ctx.session.user;
      try {
        let report;

        if (userRole === "user") {
          report = await db.query.userReports.findFirst({
            columns: {},
            where: and(
              eq(userReports.reportId, reportId),
              eq(userReports.userId, userId),
            ),
            with: {
              report: {
                columns: {
                  companyId: false,
                },
                with: {
                  company: {
                    columns: {
                      id: true,
                      companyName: true,
                    },
                  },
                },
              },
            },
          });
          if (!report) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Report not found",
            });
          }
        }

        // Fetch the report with company information
        report = await db.query.reports.findFirst({
          columns: {
            companyId: false,
          },
          where: eq(reports.id, reportId),
          with: {
            company: {
              columns: {
                id: true,
                companyName: true,
              },
            },
          },
          extras: {
            userCounts:
              sql<number>`(SELECT COUNT(*)::int FROM "user_to_reports" WHERE "user_to_reports"."report_id" = reports.id)`.as(
                "user_counts",
              ),
          },
        });

        if (!report) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Report not found",
          });
        }

        // Fetch users related to this report with their names
        const usersWithNames = await db.query.userReports.findMany({
          where: eq(userReports.reportId, reportId),
          with: {
            user: {
              columns: {
                id: true,
                userName: true,
                email: true,
              },
            },
          },
        });

        return {
          success: true,
          message: "Report fetched successfully",
          report: {
            ...report,
            usersList: usersWithNames.map((item) => ({
              id: item.user.id,
              email: item.user.email,
              userName: item.user.userName || item.user.email,
            })),
          },
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
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // this is the route for the admin only to update a report (only userids can change)
  updateUserOfReportByAdmin: protectedProcedure
    .input(
      z.object({
        reportId: z.string().uuid(),
        userIds: z.array(z.string().uuid()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to update the user of a report",
        });
      }

      const { reportId, userIds } = input;

      try {
        await db.delete(userReports).where(eq(userReports.reportId, reportId));

        await db.insert(userReports).values(
          userIds.map((userId) => ({
            userId,
            reportId,
          })),
        );

        return { success: true, message: "User updated successfully" };
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

  // this is the route for the admin and user to increment report view by report id
  incrementReportView: protectedProcedure
    .input(reportRouterSchema.incrementReportView)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role === "superAdmin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to increment report view",
        });
      }

      const { reportId } = input;
      try {
        const currentReport = await db.query.reports.findFirst({
          where: eq(reports.id, reportId),
          columns: { accessCount: true },
        });

        if (!currentReport) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Report not found",
          });
        }

        await db
          .update(reports)
          .set({ accessCount: currentReport.accessCount + 1 })
          .where(eq(reports.id, reportId));
        return {
          success: true,
          message: "Report view incremented successfully",
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

  // this is the route for the super admin to delete a report
  deleteReport: protectedProcedure
    .input(reportRouterSchema.deleteReport)
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
