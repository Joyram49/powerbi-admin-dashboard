import { TRPCError } from "@trpc/server";
import { compareSync, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";

import {
  createAdminClient,
  createClientServer,
  db,
  loginAttempts,
  users,
} from "@acme/db";

import { env } from "../../../auth/env";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const createUserSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(12, { message: "Password must be between 12-20 characters" })
      .max(20, { message: "Password must be between 12-20 characters" })
      .regex(
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\]{};:'"\\|,.<>/?[]]).+$/,
        {
          message:
            "Password must include at least one uppercase letter, one number, and one special character",
        },
      ),
    role: z.enum(["superAdmin", "admin", "user"]),
    companyId: z.string().optional(),
    userName: z.string().optional(),
    modifiedBy: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "superAdmin" || data.role === "admin") return true;
      return !!data.companyId;
    },
    {
      message: "Company ID is required for  user roles",
      path: ["companyId"],
    },
  );

export const authRouter = createTRPCRouter({
  // Create user procedure with optional metadata
  createUser: protectedProcedure
    .input(createUserSchema)
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
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const supabase = createClientServer();

      try {
        // First, check if the user exists in our database
        const userExists = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        // If user doesn't exist, return generic error without tracking attempts
        if (userExists.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid login credentials",
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

        // Check if account is locked
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

        // If lock expired, reset the lock
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

        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });

        if (error) {
          // Only track failed attempts for invalid credentials errors
          // Supabase error codes for invalid login: "invalid_credentials", "invalid_grant", or message contains "Invalid login credentials"
          const isInvalidCredentialsError =
            error.message.includes("Invalid login credentials") ||
            error.code === "invalid_credentials" ||
            error.code === "invalid_grant";

          if (isInvalidCredentialsError) {
            // Since we checked earlier that user exists, we can update login attempts
            // Update or create the login attempts record
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
          }

          // Rethrow the original error
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: error.message || "Incorrect password please try again",
          });
        }

        // update last login date for the user
        await db
          .update(users)
          .set({
            lastLogin: new Date(),
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
  signOut: protectedProcedure.mutation(async () => {
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
        // Instead of throwing an error, return a default response
        console.log(
          "User not authenticated or session expired:",
          error.message,
        );
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
    .input(
      z.object({
        // Define what can be updated
        displayName: z.string().optional(),
        // Add other updateable fields
      }),
    )
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
            display_name: input.displayName,
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
    .input(
      z.object({
        email: z.string().email({ message: "Invalid email address" }),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const supabase = createClientServer();

        const result = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email));

        if (result.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User does not exist",
          });
        }

        const { error } = await supabase.auth.signInWithOtp({
          email: input.email,
          options: {
            shouldCreateUser: false,
          },
        });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to send OTP",
          });
        }

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
    .input(
      z.object({
        email: z.string().email({ message: "Invalid email address" }),
        token: z.string().length(6),
      }),
    )
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

  // update password only use when need to change own password
  updatePassword: protectedProcedure
    .input(
      z.object({
        password: z
          .string()
          .min(12, { message: "Password must be between 12-20 characters" })
          .max(20, { message: "Password must be between 12-20 characters" })
          .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
            message:
              "Password must include at least one uppercase letter, one number, and one special character",
          }),
        email: z.string().email({ message: "Email is required!" }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const supabase = createClientServer();

        // Get the user's password history
        const userRecord = await db
          .select({ passwordHistory: users.passwordHistory })
          .from(users)
          .where(eq(users.id, ctx.session.user.id))
          .limit(1);

        if (userRecord.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        const passwordHistory = userRecord[0]?.passwordHistory ?? [];

        const isPasswordExist = passwordHistory.some((password) =>
          compareSync(password, input.password),
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
          })
          .where(eq(users.id, ctx.session.user.id));

        // reset user login attempts and unblock
        await db
          .update(loginAttempts)
          .set({
            attempts: 0,
            isLocked: false,
            lockedUntil: null,
            updatedAt: new Date(),
          })
          .where(eq(loginAttempts.email, input.email));

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
    .input(
      z.object({
        userId: z.string().uuid(),
        password: z
          .string()
          .min(12, { message: "Password must be within 12-20 characters" })
          .max(20, { message: "Password must be within 12-20 characters" })
          .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
            message:
              "Password must include at least one uppercase letter, one number, and one special character",
          }),
      }),
    )
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

        if (currentUserRole === "admin" && targetUserRole === "superAdmin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admins cannot reset Super Admin passwords.",
          });
        }

        if (currentUserRole === "admin" && currentUserId !== modifiedBy) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admins cannot reset other user password",
          });
        }

        // check if the new password was used before
        const isPasswordExist = passwordHistory.some((password) =>
          compareSync(password, input.password),
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
    .input(createUserSchema)
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
});
