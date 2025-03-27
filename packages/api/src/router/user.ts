import { TRPCError } from "@trpc/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { db, users } from "@acme/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  // this is used to get all type of users for the super admin
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "superAdmin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to view all users",
      });
    }
    try {
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
        limit: 10,
      });

      return {
        success: true,
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
  // this is used to get all admin users for the super admin
  getAdminUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "superAdmin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to view admin users",
      });
    }
    try {
      const allUsers = await db.query.users.findMany({
        columns: {
          isSuperAdmin: false,
          passwordHistory: false,
        },
        where: eq(users.role, "admin"),
        limit: 10,
      });

      return {
        success: true,
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

  // this is used to get all general users for the super admin
  getAllGeneralUser: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "superAdmin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to get all general users",
      });
    }
    try {
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
        limit: 10,
      });

      return {
        success: true,
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

  // this is used to get all users by company id for the superAdmin and admin
  getUsersByCompanyId: protectedProcedure
    .input(z.object({ companyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { companyId } = input;

      if (ctx.session.user.role === "user") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to get users by company id",
        });
      }

      try {
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
          limit: 10,
        });

        return {
          success: true,
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
      const allActiveUsers = await db.query.users.findMany({
        columns: {
          isSuperAdmin: false,
          passwordHistory: false,
        },
        where: and(eq(users.status, "active"), eq(users.role, "user")),
      });

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
      // const user = await db
      //   .select({
      //     id: users.id,
      //     userName: users.userName,
      //     isSuperAdmin: users.isSuperAdmin,
      //     email: users.email,
      //     companyId: users.companyId,
      //     role: users.role,
      //     dateCreated: users.dateCreated,
      //     lastLogin: users.lastLogin,
      //     modifiedBy: users.modifiedBy,
      //     status: users.status,
      //   })
      //   .from(users)
      //   .where(eq(users.id, userId));

      const user = await db.query.users.findFirst({
        columns: {
          passwordHistory: false,
        },
        with: {
          company: {
            columns: {
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
    }),
});
