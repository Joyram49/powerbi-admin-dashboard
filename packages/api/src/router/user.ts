import type { AdminUserAttributes } from "@supabase/supabase-js";
import { TRPCError } from "@trpc/server";
import { desc, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { createAdminClient, db, users } from "@acme/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  // this is used to get all type of users for the super admin
  getAllUsers: protectedProcedure
    .input(
      z
        .object({ limit: z.number().default(10), page: z.number().default(1) })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view all users",
        });
      }
      try {
        const { limit = 10, page = 1 } = input ?? {};

        const totalUsers = await db.$count(users, ne(users.role, "superAdmin"));

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
          where: ne(users.role, "superAdmin"),
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
        .object({ limit: z.number().default(10), page: z.number().default(1) })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view admin users",
        });
      }
      try {
        const { limit = 10, page = 1 } = input ?? {};

        const totalUsers = await db.$count(users, eq(users.role, "admin"));

        const allUsers = await db.query.users.findMany({
          columns: {
            isSuperAdmin: false,
            passwordHistory: false,
          },
          where: eq(users.role, "admin"),
          limit: limit,
          offset: (page - 1) * limit,
          orderBy: [desc(users.dateCreated)],
        });

        return {
          success: true,
          message: "all admin users fetched successfully",
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

  // this is used to get all general users for the super admin
  getAllGeneralUser: protectedProcedure
    .input(
      z
        .object({ limit: z.number().default(10), page: z.number().default(1) })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to get all general users",
        });
      }
      try {
        const { limit = 10, page = 1 } = input ?? {};

        const totalUsers = await db.$count(users, eq(users.role, "user"));

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
          where: eq(users.role, "user"),
          limit: limit,
          offset: (page - 1) * limit,
          orderBy: [desc(users.dateCreated)],
        });

        return {
          success: true,
          message: "all general users fetched successfully",
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

  // this is used to update a user by id for all users except user role
  updateUser: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        modifiedBy: z.string().uuid(),
        role: z.enum(["user", "admin", "superAdmin"]),
        status: z.enum(["active", "inactive"]).optional(),
        companyId: z.string().uuid().optional(),
        userName: z.string().optional().or(z.literal("")),
      }),
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
        await db.delete(users).where(eq(users.id, input.userId));

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
