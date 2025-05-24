import type { AdminUserAttributes } from "@supabase/supabase-js";
import type { SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";

import {
  companies,
  companyAdmins,
  createAdminClient,
  db,
  subscriptions,
  userReports,
  users,
} from "@acme/db";
import { companyRouterSchema, userRouterSchema } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  // this is used to get all type of users for the super admin
  getAllUsers: protectedProcedure
    .input(userRouterSchema.getAllUsers)
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
    .input(userRouterSchema.getAdminUsers)
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
    .input(userRouterSchema.getAllGeneralUser)
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
    .input(userRouterSchema.getUsersByCompanyId)
    .query(async ({ ctx, input }) => {
      const { companyId, limit = 10, page = 1, searched = "" } = input ?? {};

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

      try {
        // Build where conditions
        const whereConditions = [eq(users.companyId, companyId)];

        if (searched) {
          whereConditions.push(ilike(users.email, `%${searched}%`));
        }

        const totalUsers = await db.$count(
          users,
          whereConditions.length > 1
            ? and(...whereConditions)
            : whereConditions[0],
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
          where:
            whereConditions.length > 1
              ? and(...whereConditions)
              : whereConditions[0],
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
  // get all the admins of a company
  getAdminsByCompanyId: protectedProcedure
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
    .input(userRouterSchema.getUsersByAdminId)
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
    .input(userRouterSchema.getUserById)
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
    .input(userRouterSchema.getUsersByReportId)
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
                isSuperAdmin: false,
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
    .input(userRouterSchema.updateUser)
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

        // Check company status if status is being updated
        if (input.status) {
          // If company is not being changed, check prevCompanyId status
          if (input.companyId === input.prevCompanyId) {
            if (!input.prevCompanyId) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Previous company ID is required when updating user status",
              });
            }

            const prevCompany = await db.query.companies.findFirst({
              where: eq(companies.id, input.prevCompanyId),
            });

            if (!prevCompany || prevCompany.status !== "active") {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Cannot update user status: Current company is inactive",
              });
            }
          } else {
            if (!input.companyId) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Company ID is required when updating user status",
              });
            }

            const newCompany = await db.query.companies.findFirst({
              where: eq(companies.id, input.companyId),
            });

            if (!newCompany || newCompany.status !== "active") {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Cannot update user status: New company is inactive",
              });
            }
          }
        }

        // check if the companyId has active subscription or not
        if (input.companyId) {
          const companySubscription = await db.query.subscriptions.findFirst({
            where: and(
              eq(subscriptions.companyId, input.companyId),
              or(
                eq(subscriptions.status, "active"),
                eq(subscriptions.status, "trialing"),
              ),
            ),
          });

          if (!companySubscription) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "SUBSCRIPTION_REQUIRED: Company has no active subscription. Please purchase a subscription plan to add users.",
            });
          }

          // Get current active users count for the new company
          const activeUsersCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(users)
            .where(
              and(
                eq(users.companyId, input.companyId),
                eq(users.status, "active"),
              ),
            );

          const currentActiveCount = Number(activeUsersCount[0]?.count ?? 0);
          const userLimit = companySubscription.userLimit;
          const overageUser = companySubscription.overageUser;
          const totalUser = userLimit + overageUser;

          // Check user limit in these scenarios:
          // 1. Moving to a new company
          // 2. Reactivating a user in the same company
          // 3. Moving to a new company AND reactivating
          if (
            (input.prevCompanyId !== input.companyId ||
              (input.status === "active" && input.prevStatus === "inactive")) &&
            currentActiveCount >= totalUser
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "USER_LIMIT_EXCEEDED: Company has reached the user limit. Please purchase additional user access for $25 per user.",
            });
          }
        }

        // if the company id isn't same as the present company id, then delete all the user's related reports
        if (input.prevCompanyId !== input.companyId) {
          await db
            .delete(userReports)
            .where(eq(userReports.userId, input.userId));

          // Update employee counts for both companies
          if (input.prevCompanyId) {
            // Decrement previous company's count
            await db
              .update(companies)
              .set({
                numOfEmployees: sql`${companies.numOfEmployees} - 1`,
              })
              .where(eq(companies.id, input.prevCompanyId));
          }

          if (input.companyId) {
            // Increment new company's count
            await db
              .update(companies)
              .set({
                numOfEmployees: sql`${companies.numOfEmployees} + 1`,
              })
              .where(eq(companies.id, input.companyId));
          }
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
    .input(userRouterSchema.deleteUser)
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
          message: "admin can only delete it's own user(s) account",
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

        // Get the user's company before deleting
        const userToDelete = await db.query.users.findFirst({
          where: eq(users.id, input.userId),
          columns: {
            companyId: true,
          },
        });

        // Delete user from database
        await db.delete(users).where(eq(users.id, input.userId));

        // Decrement the company's employee count if the user was associated with a company
        if (userToDelete?.companyId) {
          await db
            .update(companies)
            .set({
              numOfEmployees: sql`${companies.numOfEmployees} - 1`,
            })
            .where(eq(companies.id, userToDelete.companyId));
        }

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
