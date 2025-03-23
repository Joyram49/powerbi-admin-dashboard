import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createClientServer, db, eq, users } from "@acme/db";

import { env } from "../../../auth/env";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

// // Create a cache to store recent authentication results
// const authCache = new LRUCache<string, any>({
//   max: 500, // Adjust based on expected traffic
//   ttl: 1000 * 60 * 5, // 5 minutes cache
// });

export const createUserSchema = z
  .object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be between 8-20 characters" })
      .max(20, { message: "Password must be between 8-20 characters" })
      .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
        message:
          "Password must include at least one uppercase letter, one number, and one special character",
      }),
    role: z.enum(["superAdmin", "admin", "user"]),
    companyId: z.string().optional(),
    userName: z.string().optional(),
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
  // Signup procedure with optional metadata
  signUp: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      const supabase = createClientServer();
      try {
        // Use the regular signUp method instead of admin.createUser
        const response = await supabase.auth.signUp({
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

        if (response.error) {
          console.error("Auth signup error:", response.error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              response.error.message || "Failed to create user in auth system",
          });
        }

        if (!response.data.user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user - no user returned",
          });
        }

        // Insert the user into your custom users table.
        await db.insert(users).values({
          id: response.data.user.id,
          userName: input.userName ?? input.email,
          email: input.email,
          companyId: input.companyId ?? null,
          role: input.role,
          isSuperAdmin: input.role === "superAdmin",
          dateCreated: new Date(),
        });

        return {
          user: response.data.user,
        };
      } catch (error) {
        console.error("Signup error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : String(error),
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
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });

        console.log(data);

        if (error) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: error.message || "Authentication failed",
          });
        }

        return {
          user: data.user,
          session: data.session,
        };
      } catch (err) {
        console.error(
          "Sign-in error:",
          err instanceof Error ? err.message : String(err),
        );

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
  signOut: publicProcedure.mutation(async () => {
    try {
      const supabase = createClientServer();
      // Perform sign out
      const { error } = await supabase.auth.signOut({ scope: "global" });

      if (error) {
        console.error("Sign-out error:", error.message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Logout failed",
        });
      }

      // Note: We can't manually clear cookies here since we're in a tRPC procedure
      // and not a route handler. We'll need to clear cookies in the client after signOut
      // returns success.

      console.log("User signed out successfully");
      return {
        success: true,
        // Return a flag indicating that cookies should be cleared client-side
        clearCookies: true,
      };
    } catch (error) {
      console.error(
        "Sign-out error:",
        error instanceof Error ? error.message : String(error),
      );
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to get user profile",
        });
      }
      return data;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: String(error),
      });
    }
  }),

  // Password reset request
  resetPasswordRequest: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const supabase = createClientServer();
        const { error } = await supabase.auth.resetPasswordForEmail(
          input.email,
          {
            // Optional: specify redirect URL for password reset
            redirectTo: process.env.NEXT_PUBLIC_APP_URL + "/reset-password",
          },
        );

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Password reset request failed",
          });
        }

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
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

  // create super admin user
  createSuperAdmin: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      // const cacheKey = `signup:${input.email}`;

      // // Check cache first
      // const cachedResult = authCache.get(cacheKey);
      // if (cachedResult) return cachedResult;
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
              error.message || "Failed to create super admin in auth system",
          });
        }
        if (!data.user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create super admin in auth system",
          });
        }

        // Insert the created super admin into your custom users table.
        await db.insert(users).values({
          id: data.user.id,
          userName: input.userName ?? input.email,
          isSuperAdmin: true,
          email: input.email,
          role: input.role,
          dateCreated: new Date(),
          // Optionally, leave lastLogin and companyId as null.
          modifiedBy: input.email, // record the creator's email as modifiedBy
          status: "active",
        });

        // Cache successful signup
        // authCache.set(cacheKey, data);

        return { success: true, user: data.user };
      } catch (error) {
        console.error("Error creating super admin:", error);
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
          return {
            success: false,
            message: error.message || "Failed to send OTP",
          };
        }

        return {
          success: true,
          message: "OTP sent successfully",
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to send OTP";
        return {
          success: false,
          message: errorMessage,
        };
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
          return {
            success: false,
            message: error.message || "Failed to verify OTP",
          };
        }

        return {
          success: true,
          message: "OTP verified successfully",
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to verify OTP";
        return {
          success: false,
          message: errorMessage,
        };
      }
    }),

  // update password
  updatePassword: protectedProcedure
    .input(
      z.object({
        password: z
          .string()
          .min(8, { message: "Password must be between 8-20 characters" })
          .max(20, { message: "Password must be between 8-20 characters" })
          .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
            message:
              "Password must include at least one uppercase letter, one number, and one special character",
          }),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const supabase = createClientServer();

        // Update the password
        const { error } = await supabase.auth.updateUser({
          password: input.password,
        });

        if (error) {
          return {
            success: false,
            message: error.message || "Failed to update password",
          };
        }

        return {
          success: true,
          message: "Password updated successfully",
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update password";
        return {
          success: false,
          message: errorMessage,
        };
      }
    }),
});
