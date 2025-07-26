import { TRPCError } from "@trpc/server";
import { compareSync, hash } from "bcryptjs";
import { and, eq, or } from "drizzle-orm";

import {
  companies,
  companyAdmins,
  createAdminClient,
  createClientServer,
  db,
  loginAttempts,
  subscriptions,
  users,
} from "@acme/db";
import { authRouterSchema } from "@acme/db/schema";

import { env } from "../../../auth/env";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { sendOTPToEmail } from "../utils/sendOTPToEmail";

export const authRouter = createTRPCRouter({
  // Create user procedure with optional metadata
  createUser: protectedProcedure
    .input(authRouterSchema.createUser)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role === "user") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to create a user",
        });
      }

      if (
        ctx.session.user.role === "admin" &&
        (input.role === "admin" || input.role === "superAdmin")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to create a user with this role",
        });
      }

      const supabase = createAdminClient();

      try {
        // check the company plan if the company has exceeded the limit of users
        if (input.role === "user" && input.companyId) {
          // get the company data
          const company = await db
            .select()
            .from(companies)
            .where(
              and(
                eq(companies.id, input.companyId),
                eq(companies.status, "active"),
              ),
            );

          if (!company[0]) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Company not found",
            });
          }

          // get the company subscription data
          const companySubscription = await db
            .select()
            .from(subscriptions)
            .where(
              and(
                eq(subscriptions.companyId, input.companyId),
                or(
                  eq(subscriptions.status, "active"),
                  eq(subscriptions.status, "trialing"),
                ),
              ),
            );

          if (!companySubscription[0]) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "SUBSCRIPTION_REQUIRED: Company has no active subscription. Please purchase a subscription plan to add users.",
            });
          }

          const currentEmployeeCount = company[0]?.numOfEmployees ?? 0;
          const userLimit = companySubscription[0]?.userLimit ?? 0;
          const overageUser = companySubscription[0]?.overageUser ?? 0;
          const totalUser = userLimit + overageUser;

          // Check if adding a new user would exceed the user limit
          if (currentEmployeeCount >= totalUser) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "USER_LIMIT_EXCEEDED: Company has reached the user limit. Please purchase additional user access for $25 per user.",
            });
          }

          // Use admin API to create user without affecting current session
          const {
            data: { user },
            error,
          } = await supabase.auth.admin.createUser({
            email: input.email,
            password: input.password,
            email_confirm: true,
            user_metadata: {
              role: input.role,
              userName: input.userName ?? input.email,
            },
          });

          if (error) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: error.message || "Failed to create user in auth system",
            });
          }

          const hashedPassword = await hash(input.password, 10);

          // Insert the user into your custom users table.
          await db.insert(users).values({
            id: user?.id,
            userName: input.userName ?? input.email,
            email: input.email,
            companyId: input.companyId ?? null,
            role: input.role,
            isSuperAdmin: false,
            dateCreated: new Date(),
            modifiedBy: ctx.session.user.id,
            passwordHistory: [hashedPassword],
          });

          // Update company's employee count and reset additional user purchase flag
          await db
            .update(companies)
            .set({
              numOfEmployees: currentEmployeeCount + 1,
            })
            .where(eq(companies.id, input.companyId));

          return {
            success: true,
            user: user,
          };
        }

        // Use admin API to create user without affecting current session
        const {
          data: { user },
          error,
        } = await supabase.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: true,
          user_metadata: {
            role: input.role,
            userName: input.userName ?? input.email,
          },
        });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to create user in auth system",
          });
        }

        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user in auth system",
          });
        }

        const hashedPassword = await hash(input.password, 10);

        // Insert the user into your custom users table.
        await db.insert(users).values({
          id: user.id,
          userName: input.userName ?? input.email,
          email: input.email,
          companyId: input.companyId ?? null,
          role: input.role,
          isSuperAdmin: input.role === "superAdmin",
          dateCreated: new Date(),
          modifiedBy: ctx.session.user.id,
          passwordHistory: [hashedPassword],
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
          message: error instanceof Error ? error.message : "failed to signup",
        });
      }
    }),

  // Signin procedure
  signIn: publicProcedure
    .input(authRouterSchema.signIn)
    .mutation(async ({ input }) => {
      const supabase = createClientServer();
      try {
        // First, check if the user exists in our database
        const userExists = await db
          .select({
            id: users.id,
            status: users.status,
            passwordHistory: users.passwordHistory,
            isLoggedIn: users.isLoggedIn,
            lastLogin: users.lastLogin,
          })
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        // check if user exists if not then return error
        const user = userExists[0];
        if (!user || userExists.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid login credentials",
          });
        }

        // check if user is not active
        const isInactive = userExists[0]?.status === "inactive";

        if (isInactive) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Account is inactive. Please contact your administrator.",
          });
        }

        // Check if account is locked
        const lockRecord = await db
          .select()
          .from(loginAttempts)
          .where(eq(loginAttempts.email, input.email))
          .limit(1);

        const now = new Date();
        const lockRecordExists = lockRecord.length > 0;

        // if account is locked for a certain period of time, return error
        if (
          lockRecordExists &&
          lockRecord[0]?.isLocked === true &&
          lockRecord[0]?.lockedUntil &&
          lockRecord[0]?.lockedUntil > now
        ) {
          const lockRemainingMin = Math.ceil(
            (lockRecord[0].lockedUntil.getTime() - now.getTime()) / (1000 * 60),
          );
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Account locked. Try again in ${lockRemainingMin} minute(s).`,
          });
        }

        // if account is locked and the lock has expired(more than 30 minutes), reset the lock
        if (
          lockRecordExists &&
          lockRecord[0]?.isLocked === true &&
          lockRecord[0]?.lockedUntil &&
          lockRecord[0]?.lockedUntil <= now
        ) {
          await db
            .update(loginAttempts)
            .set({
              isLocked: false,
              attempts: 0,
              updatedAt: now,
              lockedUntil: null,
            })
            .where(eq(loginAttempts.email, input.email));
        }

        // generate the active password from password history
        const activePassword = user.passwordHistory?.[0] ?? "";

        // check if the password is correct
        const isPasswordCorrect = compareSync(input.password, activePassword);

        // if the password is incorrect, update the user loging attempts and lock the account if the attempts are more than 5
        if (!isPasswordCorrect) {
          if (lockRecordExists) {
            const attempts = (lockRecord[0]?.attempts ?? 0) + 1;
            const MAX_ATTEMPTS = 5;
            const LOCK_DURATION_MINUTES = 30;

            // Check if we need to lock the account
            if (attempts > MAX_ATTEMPTS) {
              const lockedUntil = new Date();
              lockedUntil.setMinutes(
                lockedUntil.getMinutes() + LOCK_DURATION_MINUTES,
              );

              await db
                .update(loginAttempts)
                .set({
                  attempts,
                  lastAttempt: now,
                  isLocked: true,
                  lockedUntil,
                  updatedAt: now,
                })
                .where(eq(loginAttempts.email, input.email));

              throw new TRPCError({
                code: "FORBIDDEN",
                message: `Too many failed login attempts. Account locked for ${LOCK_DURATION_MINUTES} minutes.`,
              });
            } else {
              await db
                .update(loginAttempts)
                .set({
                  attempts,
                  lastAttempt: now,
                  updatedAt: now,
                })
                .where(eq(loginAttempts.email, input.email));
            }
          } else {
            // Create a new record
            await db.insert(loginAttempts).values({
              id: crypto.randomUUID(),
              email: input.email,
              attempts: 1,
              lastAttempt: now,
              createdAt: now,
              updatedAt: now,
            });
          }

          // Rethrow the original error
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid login credentials",
          });
        }

        // check remember me and last login date
        const daySinceLastLogin = userExists[0]?.lastLogin
          ? Math.floor(
              (now.getTime() - userExists[0]?.lastLogin.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : Infinity;

        if (!input.isRemembered || daySinceLastLogin > 30) {
          await sendOTPToEmail(input.email);
          return {
            otpRequired: true,
            email: input.email,
            password: input.password,
          };
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to sign in",
          });
        }

        // update last login date for the user
        await db
          .update(users)
          .set({
            lastLogin: new Date(),
            isLoggedIn: input.isLoggedIn,
          })
          .where(eq(users.email, input.email));

        // If login successful, reset attempts
        if (lockRecordExists) {
          await db
            .update(loginAttempts)
            .set({
              attempts: 0,
              isLocked: false,
              updatedAt: now,
            })
            .where(eq(loginAttempts.email, input.email));
        }

        return {
          success: true,
          user: data.user,
          session: data.session,
        };
      } catch (err) {
        if (err instanceof TRPCError) {
          throw err;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Authentication failed",
        });
      }
    }),

  // Signout procedure
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const supabase = createClientServer();
      // Perform sign out
      const { error } = await supabase.auth.signOut({ scope: "global" });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Logout failed",
        });
      }

      // update user isLoggedIn to false
      await db
        .update(users)
        .set({ isLoggedIn: false })
        .where(eq(users.id, ctx.session.user.id));

      return {
        success: true,
        clearCookies: true,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Sign-out failed",
      });
    }
  }),

  // Get current session
  getSession: publicProcedure.query(async () => {
    try {
      const supabase = createClientServer();
      const { data } = await supabase.auth.getSession();
      return data.session;
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

  // get user profile
  getProfile: publicProcedure.query(async () => {
    try {
      const supabase = createClientServer();
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        return { user: null };
      }

      return data;
    } catch (error) {
      console.error("Unexpected error in getProfile:", error);
      // Return a default response instead of throwing
      return { user: null };
    }
  }),

  // Update user profile (protected route)
  updateProfile: protectedProcedure
    .input(authRouterSchema.updateProfile)
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session.user.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }
        const supabase = createClientServer();

        const { error } = await supabase.auth.updateUser({
          data: {
            userName: input.userName,
            // Map other fields as needed
          },
        });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Profile update failed",
          });
        }

        // Invalidate any cached sessions
        // authCache.clear();

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // Send OTP to verify email
  sendOTP: publicProcedure
    .input(authRouterSchema.sendOTP)
    .mutation(async ({ input }) => {
      try {
        await sendOTPToEmail(input.email);

        return {
          success: true,
          message: "OTP sent successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to send OTP",
        });
      }
    }),

  // verify OTP
  verifyOTP: publicProcedure
    .input(authRouterSchema.verifyOTP)
    .mutation(async ({ input }) => {
      try {
        const supabase = createClientServer();
        const { error } = await supabase.auth.verifyOtp({
          email: input.email,
          token: input.token,
          type: "email",
        });

        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "You have provided an incorrect access code, please try again",
          });
        }

        return {
          success: true,
          message: "OTP verified successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to verify OTP",
        });
      }
    }),

  // verify signin OTP
  verifySigninOTP: publicProcedure
    .input(authRouterSchema.verifySigninOTP)
    .mutation(async ({ input }) => {
      try {
        const supabase = createClientServer();

        // verify the OTP
        const { error } = await supabase.auth.verifyOtp({
          email: input.email,
          token: input.token,
          type: "email",
        });

        // handle error if OTP is incorrect
        if (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "You have provided an incorrect access code, please try again",
          });
        }

        // sign in with password
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: input.email,
            password: input.password,
          });

        // handle error if sign in with password is incorrect
        if (signInError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: signInError.message || "Failed to sign in",
          });
        }

        // update last login date for the user
        await db
          .update(users)
          .set({
            lastLogin: new Date(),
            isLoggedIn: true,
          })
          .where(eq(users.email, input.email));

        // update login attempts if user is locked

        const lockedAccount = await db
          .select()
          .from(loginAttempts)
          .where(eq(loginAttempts.email, input.email))
          .limit(1);

        const lockRecordExists = lockedAccount.length > 0;

        if (lockRecordExists) {
          await db
            .update(loginAttempts)
            .set({
              attempts: 0,
              isLocked: false,
              updatedAt: new Date(),
            })
            .where(eq(loginAttempts.email, input.email));
        }

        return {
          success: true,
          user: data.user,
          session: data.session,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to verify OTP",
        });
      }
    }),

  // update password only use when need to change own password
  updatePassword: protectedProcedure
    .input(authRouterSchema.updatePassword)
    .mutation(async ({ ctx, input }) => {
      const { id: userId, email: userEmail } = ctx.session.user;

      if (!userId || !userEmail) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "you have to be logged in to update password",
        });
      }

      try {
        const supabase = createClientServer();

        // Get the user's password history
        const userRecord = await db
          .select({ passwordHistory: users.passwordHistory })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (userRecord.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        const passwordHistory = userRecord[0]?.passwordHistory ?? [];

        const isPasswordExist = passwordHistory.some((hashedPassword) =>
          compareSync(input.password, hashedPassword),
        );

        // Check if the new password is in the history
        if (isPasswordExist) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Password cannot match the last 3 historical passwords",
          });
        }

        // Update the password
        const { error } = await supabase.auth.updateUser({
          password: input.password,
        });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to update password",
          });
        }

        const hashedPassword = await hash(input.password, 10);

        // Update the password history (keep at most 3 passwords)
        const updatedHistory = [hashedPassword, ...passwordHistory];
        if (updatedHistory.length > 3) {
          updatedHistory.length = 3;
        }

        // Update the password history in the database
        await db
          .update(users)
          .set({
            passwordHistory: updatedHistory,
            isLoggedIn: false,
          })
          .where(eq(users.id, userId));

        // reset user login attempts and unblock
        await db
          .update(loginAttempts)
          .set({
            attempts: 0,
            isLocked: false,
            lockedUntil: null,
            updatedAt: new Date(),
          })
          .where(eq(loginAttempts.email, userEmail));

        // Sign out from all devices
        await supabase.auth.signOut({ scope: "global" });

        return {
          success: true,
          message:
            "Password updated successfully. You have been signed out from all devices.",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update password",
        });
      }
    }),

  // reset user password for admin and super admin only
  resetUserPassword: protectedProcedure
    .input(authRouterSchema.resetUserPassword)
    .mutation(async ({ ctx, input }) => {
      try {
        const supabase = createAdminClient();

        const { id: currentUserId, role: currentUserRole } = ctx.session.user;

        if (currentUserRole === "user") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not allowed to reset user password",
          });
        }

        // fetch targeted user and handle errors
        const targetUser = await db
          .select()
          .from(users)
          .where(eq(users.id, input.userId))
          .limit(1);

        if (!targetUser.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found!",
          });
        }

        const targetUserRole = targetUser[0]?.role;
        const passwordHistory = targetUser[0]?.passwordHistory ?? [];
        const targetUserEmail: string = targetUser[0]?.email ?? "";
        const modifiedBy = targetUser[0]?.modifiedBy;
        const companyId = targetUser[0]?.companyId;

        if (currentUserRole === "admin") {
          if (targetUserRole === "superAdmin") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Admins cannot reset Super Admin passwords.",
            });
          }
          // Check if we have a valid companyId
          if (!companyId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Company ID is required for this operation",
            });
          }
          // get company data using companyId
          const companyData = await db
            .select()
            .from(companyAdmins)
            .where(eq(companyAdmins.companyId, companyId));

          if (!companyData[0]) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Admin is not associated with this company",
            });
          }

          const isAuthorized =
            currentUserId === modifiedBy &&
            companyData.some((company) => company.userId === currentUserId);

          if (!isAuthorized) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You are not authorized to reset this user password",
            });
          }
        }

        // check if the new password was used before
        const isPasswordExist = passwordHistory.some((hashedPassword) =>
          compareSync(input.password, hashedPassword),
        );

        if (isPasswordExist) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Password cannot match the last 3 historical passwords",
          });
        }

        // Update password in Supabase
        const { error } = await supabase.auth.admin.updateUserById(
          input.userId,
          {
            password: input.password,
          },
        );

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to reset password",
          });
        }

        // hashed and store the updated password
        const hashedPassword = await hash(input.password, 10);
        const updatedPasswordHistory = [
          hashedPassword,
          ...passwordHistory,
        ].slice(0, 3);

        await db
          .update(users)
          .set({
            passwordHistory: updatedPasswordHistory,
            modifiedBy: currentUserId,
          })
          .where(eq(users.id, input.userId));

        // reset the login attempts
        await db
          .update(loginAttempts)
          .set({
            attempts: 0,
            isLocked: false,
            lockedUntil: null,
            updatedAt: new Date(),
          })
          .where(eq(loginAttempts.email, targetUserEmail));

        return {
          success: true,
          message:
            "Password reset successfully. Login attempts have been cleared.",
        };
      } catch (err) {
        if (err instanceof TRPCError) {
          throw err;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Authentication failed",
        });
      }
    }),

  // Signup procedure (for creating superAdmin)
  signUp: protectedProcedure
    .input(authRouterSchema.createUser)
    .mutation(async ({ ctx, input }) => {
      // Check if the user is superAdmin
      if (ctx.session.user.role !== "superAdmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only superAdmin can create another superAdmin",
        });
      }

      // Check if trying to create superAdmin
      if (input.role !== "superAdmin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This endpoint is only for creating superAdmin users",
        });
      }

      const supabase = createClientServer();
      try {
        const { data, error } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            data: {
              role: input.role,
              userName: input.userName ?? input.email,
            },
            emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/api/auth/confirm`,
          },
        });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error.message || "Failed to create superAdmin in auth system",
          });
        }
        if (!data.user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create superAdmin in auth system",
          });
        }

        const hashedPassword = await hash(input.password, 10);

        // Insert the user into your custom users table.
        await db.insert(users).values({
          id: data.user.id,
          userName: input.userName ?? input.email,
          isSuperAdmin: true,
          email: input.email,
          role: input.role,
          dateCreated: new Date(),
          modifiedBy: ctx.session.user.email,
          status: "active",
          passwordHistory: [hashedPassword],
        });

        return { success: true, user: data.user };
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

  // Add this new endpoint before the last closing brace of authRouter
  purchaseAdditionalUser: protectedProcedure
    .input(authRouterSchema.purchaseAdditionalUser)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user has permission
        if (ctx.session.user.role && ctx.session.user.role === "user") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to purchase additional users",
          });
        }

        // Get company data with admin relationships
        const company = await db.query.companies.findFirst({
          where: and(
            eq(companies.id, input.companyId),
            eq(companies.status, "active"),
          ),
          with: {
            admins: {
              columns: {
                userId: true,
              },
            },
          },
        });

        if (!company) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Company not found",
          });
        }

        // Check if user is company admin or super admin
        if (
          ctx.session.user.role === "admin" &&
          !company.admins.some((admin) => admin.userId === ctx.session.user.id)
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only company admin can purchase additional users",
          });
        }

        // TODO: Implement your payment processing logic here
        // For example, using Stripe to process the $25 payment
        // const paymentResult = await processPayment(25);

        // Update company's additional user purchase flag
        await db
          .update(companies)
          .set({
            modifiedBy: ctx.session.user.email,
            lastActivity: new Date(),
          })
          .where(eq(companies.id, input.companyId));

        return {
          success: true,
          message:
            "Additional user purchase successful. You can now add one more user.",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to purchase additional user",
        });
      }
    }),
});
