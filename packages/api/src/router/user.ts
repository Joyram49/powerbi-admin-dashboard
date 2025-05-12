import type { AdminUserAttributes } from "@supabase/supabase-js";
import type { SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, ilike, inArray, ne } from "drizzle-orm";
import { z } from "zod";

import {
  companyAdmins,
  createAdminClient,
  db,
  userReports,
  users,
} from "@acme/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  // this is used to get all type of users for the super admin
  getAllUsers: protectedProcedure
    .input(
      z
        .object({
          searched: z.string().toLowerCase().optional().default(""),
          limit: z.number().default(10),
          page: z.number().default(1),
          sortBy: z
            .enum(["userName", "dateCreated"])
            .optional()
            .default("dateCreated"),
          status: z.enum(["active", "inactive"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view all users",
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
        // Dynamic WHERE conditions
        const whereConditions: SQL[] = [
          ne(users.role, "superAdmin"), // Exclude superAdmins
        ];

        if (searched) {
          whereConditions.push(ilike(users.email, `%${searched}%`));
        }

        if (status) {
          whereConditions.push(eq(users.status, status));
        }

        const totalUsers = await db.$count(users, and(...whereConditions));

        const orderByCondition =
          sortBy === "userName"
            ? [asc(users.userName)]
            : [desc(users.dateCreated)];

        const allUsers = await db.query.users.findMany({
          columns: {
            isSuperAdmin: false,
            passwordHistory: false,
          },
          with: {
            company: {
              columns: {
                companyName: true,
              },
            },
          },
          where:
            whereConditions.length > 1
              ? and(...whereConditions)
              : whereConditions[0],
          limit,
          offset: (page - 1) * limit,
          orderBy: orderByCondition,
        });

        return {
          success: true,
          message: "all users fetched successfully",
          total: totalUsers,
          limit,
          page,
          data: allUsers,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "failed to fetch users",
        });
      }
    }),
  // this is used to get all admin users for the super admin
  getAdminUsers: protectedProcedure
    .input(
      z
        .object({
          searched: z.string().toLowerCase().optional().default(""),
          limit: z.number().default(10),
          page: z.number().default(1),
          sortBy: z
            .enum(["userName", "dateCreated"])
            .optional()
            .default("dateCreated"),
          status: z.enum(["active", "inactive"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view admin users",
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
        // Dynamic WHERE conditions
        const whereConditions: SQL[] = [eq(users.role, "admin")];

        if (searched) {
          whereConditions.push(ilike(users.email, `%${searched}%`));
        }

        if (status) {
          whereConditions.push(eq(users.status, status));
        }

        const totalUsers = await db.$count(users, and(...whereConditions));

        const orderByCondition =
          sortBy === "userName"
            ? [asc(users.userName)]
            : [desc(users.dateCreated)];

        const allUsers = await db.query.users.findMany({
          columns: {
            isSuperAdmin: false,
            passwordHistory: false,
          },
          with: {
            company: {
              columns: {
                companyName: true,
              },
            },
          },
          where:
            whereConditions.length > 1
              ? and(...whereConditions)
              : whereConditions[0],
          limit,
          offset: (page - 1) * limit,
          orderBy: orderByCondition,
        });

        return {
          success: true,
          message: "All admin users fetched successfully",
          total: totalUsers,
          limit,
          page,
          data: allUsers,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to fetch users",
        });
      }
    }),

  // this is used to get all general users for the super admin
  getAllGeneralUser: protectedProcedure
    .input(
      z
        .object({
          searched: z.string().toLowerCase().optional().default(""),
          limit: z.number().default(10),
          page: z.number().default(1),
          sortBy: z
            .enum(["userName", "dateCreated"])
            .optional()
            .default("dateCreated"),
          status: z.enum(["active", "inactive"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to get all general users",
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
        // Dynamic WHERE conditions
        const whereConditions: SQL[] = [eq(users.role, "user")];

        if (searched) {
          whereConditions.push(ilike(users.email, `%${searched}%`));
        }

        if (status) {
          whereConditions.push(eq(users.status, status));
        }

        const totalUsers = await db.$count(users, and(...whereConditions));

        const orderByCondition =
          sortBy === "userName"
            ? [asc(users.userName)]
            : [desc(users.dateCreated)];

        const allUsers = await db.query.users.findMany({
          columns: {
            isSuperAdmin: false,
            passwordHistory: false,
          },
          with: {
            company: {
              columns: {
                companyName: true,
              },
            },
          },
          where:
            whereConditions.length > 1
              ? and(...whereConditions)
              : whereConditions[0],
          limit,
          offset: (page - 1) * limit,
          orderBy: orderByCondition,
        });

        return {
          success: true,
          message: "All general users fetched successfully",
          total: totalUsers,
          limit,
          page,
          data: allUsers,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to fetch users",
        });
      }
    }),

  // this is used to get all users by company id for the superAdmin and admin
  getUsersByCompanyId: protectedProcedure
    .input(
      z
        .object({
          companyId: z.string().uuid(),
          limit: z.number().optional().default(10),
          page: z.number().optional().default(1),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { companyId, limit = 10, page = 1 } = input ?? {};

      if (!companyId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please provide companyId",
        });
      }

      if (ctx.session.user.role === "user") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to get users by company id",
        });
      }

      if (!companyId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Company ID is required",
        });
      }

      try {
        const totalUsers = await db.$count(
          users,
          eq(users.companyId, companyId),
        );

        const allUsers = await db.query.users.findMany({
          columns: {
            isSuperAdmin: false,
            passwordHistory: false,
          },
          with: {
            company: {
              columns: {
                companyName: true,
              },
            },
          },
          where: eq(users.companyId, companyId),
          limit: limit,
          offset: (page - 1) * limit,
          orderBy: [desc(users.dateCreated)],
        });

        return {
          success: true,
          message: "all users fetched successfully",
          total: totalUsers,
          limit,
          page,
          users: allUsers,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "failed to fetch users",
        });
      }
    }),

  // this is used to get all active users for the superAdmin
  getAllActiveUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "superAdmin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to get all active users",
      });
    }
    try {
      const allActiveUsers = await db.$count(users, eq(users.status, "active"));
      return {
        success: true,
        users: allActiveUsers,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error ? error.message : "failed to fetch users",
      });
    }
  }),

  // this endpoint is for the admin to get all the users from multiple companies that they are owning
  getUsersByAdminId: protectedProcedure
    .input(
      z
        .object({
          searched: z.string().optional().default(""),
          limit: z.number().optional().default(10),
          page: z.number().optional().default(1),
          sortBy: z
            .enum(["userName", "dateCreated"])
            .optional()
            .default("dateCreated"),
          status: z.enum(["active", "inactive"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to get users",
        });
      }

      const { id: adminId } = ctx.session.user;
      const {
        limit = 10,
        page = 1,
        searched = "",
        sortBy = "dateCreated",
        status,
      } = input ?? {};

      try {
        const whereConditions: SQL[] = [];

        if (searched) {
          whereConditions.push(ilike(users.email, `%${searched}%`));
        }

        if (status) {
          whereConditions.push(eq(users.status, status));
        }

        const orderByCondition =
          sortBy === "userName"
            ? [asc(users.userName)]
            : [desc(users.dateCreated)];

        // Get all companies where the admin is associated
        const adminCompanies = await db.query.companyAdmins.findMany({
          where: eq(companyAdmins.userId, adminId),
          columns: {
            companyId: true,
          },
        });

        const companyIds = adminCompanies.map((company) => company.companyId);

        if (companyIds.length === 0) {
          return {
            success: true,
            message: "No companies found",
            total: 0,
            limit,
            page,
            data: [],
          };
        }

        // Get total count across all companies
        const totalUsers = await db.$count(
          users,
          whereConditions.length > 0
            ? and(inArray(users.companyId, companyIds), ...whereConditions)
            : inArray(users.companyId, companyIds),
        );

        // Get users from all companies
        const userList = await db.query.users.findMany({
          columns: {
            isSuperAdmin: false,
            passwordHistory: false,
            companyId: false,
          },
          with: {
            company: {
              columns: {
                companyName: true,
              },
            },
          },
          where:
            whereConditions.length > 0
              ? and(inArray(users.companyId, companyIds), ...whereConditions)
              : inArray(users.companyId, companyIds),
          limit,
          offset: (page - 1) * limit,
          orderBy: orderByCondition,
        });

        return {
          success: true,
          message: "Users fetched successfully",
          total: totalUsers,
          limit,
          page,
          data: userList,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "failed to fetch users",
        });
      }
    }),
  // this is used to get a all types of user by id for all users
  getUserById: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const { userId } = input;

      try {
        const user = await db.query.users.findFirst({
          columns: {
            passwordHistory: false,
          },
          with: {
            company: {
              columns: {
                id: true,
                companyName: true,
              },
            },
          },
          where: eq(users.id, userId),
        });
        return {
          success: true,
          user: user,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "failed to fetch user",
        });
      }
    }),

  // this route is used to get all the users by report id
  getUsersByReportId: protectedProcedure
    .input(z.object({ reportId: z.string().uuid() }))
    .query(async ({ input }) => {
      const { reportId } = input;

      try {
        const users = await db.query.userReports.findMany({
          where: eq(userReports.reportId, reportId),
          columns: {
            userId: false,
          },
          with: {
            user: {
              columns: {
                passwordHistory: false,
                modifiedBy: false,
                isSuperAdmin: false,
                role: false,
              },
            },
          },
        });

        const flattenedUsers = users.map(({ user, ...rest }) => ({
          ...rest,
          ...user,
        }));

        return {
          success: true,
          message: "Users fetched successfully",
          data: flattenedUsers,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    }),

  // this is used to update a user by id for all users except user role
  updateUser: protectedProcedure
    .input(
      z
        .object({
          userId: z.string().uuid(),
          modifiedBy: z.string().uuid(),
          role: z.enum(["user", "admin", "superAdmin"]),
          status: z.enum(["active", "inactive"]).optional(),
          companyId: z.string().uuid().optional(),
          prevCompanyId: z.string().uuid().optional(),
          userName: z.string().optional().or(z.literal("")),
        })
        .refine(
          (data) => {
            if (data.companyId) {
              return !!data.prevCompanyId;
            }
            return true;
          },
          {
            message:
              "When updating company, both new and previous company IDs must be provided",
            path: ["prevCompanyId"],
          },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const { id: updaterId, role: updaterRole } = ctx.session.user;
      // check if the user is capable of updating the user
      if (updaterRole === "user") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to update user",
        });
      }

      if (updaterRole === "admin" && input.role === "superAdmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to update super admin",
        });
      }

      if (updaterRole === "admin" && updaterId === input.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to update your own account",
        });
      }

      if (updaterRole === "admin" && updaterId !== input.modifiedBy) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "admin can only update it's own user(s)",
        });
      }

      const supabaseAdmin = createAdminClient();

      try {
        const authUpdateData: AdminUserAttributes = {};

        // Update user metadata
        if (input.userName) {
          authUpdateData.user_metadata = { userName: input.userName };
        }
        authUpdateData.user_metadata = { role: input.role };

        // if the company id isn't same as the present company id, then delete all the user's related reports
        if (input.prevCompanyId !== input.companyId) {
          await db
            .delete(userReports)
            .where(eq(userReports.userId, input.userId));
        }

        // Update Supabase Auth
        if (Object.keys(authUpdateData).length > 0) {
          const { error: authError } =
            await supabaseAdmin.auth.admin.updateUserById(
              input.userId,
              authUpdateData,
            );
          if (authError)
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to update Supabase Auth: ${authError.message}`,
            });
        }

        const updateData = Object.fromEntries(
          Object.entries({
            ...input,
            lastModifiedAt: new Date(),
          }).filter(([_, value]) => value !== ""),
        );

        const updateUser = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, input.userId))
          .returning({ userId: users.id });

        return {
          success: true,
          message: "User updated successfully",
          user: updateUser,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "failed to update user",
        });
      }
    }),

  // this is used to delete a user by id for all users except user role
  deleteUser: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        modifiedBy: z.string().uuid(),
        role: z.enum(["user", "admin", "superAdmin"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id: updaterId, role: updaterRole } = ctx.session.user;
      // check if the user is capable of updating the user
      if (updaterRole === "user") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to delete user",
        });
      }

      if (updaterRole === "admin" && input.role === "superAdmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to delete super admin",
        });
      }

      if (updaterRole === "admin" && updaterId === input.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to delete your own account",
        });
      }

      if (updaterRole === "admin" && updaterId !== input.modifiedBy) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "admin can only delete it's own user(s)",
        });
      }

      const supabaseAdmin = createAdminClient();

      try {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
          input.userId,
        );

        if (authError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to delete user from Supabase Auth: ${authError.message}`,
          });
        }

        // delete users from supbase database user table
        await db.delete(users).where(eq(users.id, input.userId));

        // delete company admin relationships if the user is an admin
        if (input.role === "admin") {
          await db
            .delete(companyAdmins)
            .where(eq(companyAdmins.userId, input.userId));
        }

        // delete user from supabase database userReports table
        await db
          .delete(userReports)
          .where(eq(userReports.userId, input.userId));

        return {
          success: true,
          message: "User deleted successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "failed to delete user",
        });
      }
    }),
});
