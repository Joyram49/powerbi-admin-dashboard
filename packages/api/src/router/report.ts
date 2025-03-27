import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db, reports, userReports } from "@acme/db";

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
  getAllReports: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "superAdmin") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not authorized to get all reports",
      });
    }

    try {
      const reportsWithUserCounts = await db.query.reports.findMany({
        columns: {
          companyId: false,
        },
        // extras: {
        //   userCounts: db
        //     .$count(userReports, eq(userReports.reportId, reports.id))
        //     .as("userCounts"),
        // },
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
      });

      const formattedReports = reportsWithUserCounts.map(
        ({ userReports, ...report }) => ({
          ...report,
          userCounts: userReports.length,
        }),
      );

      return {
        success: true,
        reports: formattedReports,
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
});
