import { TRPCError } from "@trpc/server";
import { LRUCache } from "lru-cache";
import { z } from "zod";

import { createClientServer } from "@acme/auth";
import { db, users } from "@acme/db";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

// Create a cache to store recent authentication results
const authCache = new LRUCache<string, any>({
  max: 500, // Adjust based on expected traffic
  ttl: 1000 * 60 * 5, // 5 minutes cache
});

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
      const cacheKey = `signup:${input.email}`;

      // Check cache first
      const cachedResult = authCache.get(cacheKey);
      if (cachedResult) return cachedResult;

      const supabase = createClientServer();
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email: input.email,
          password: input.password,
        });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to create user in auth system",
          });
        }
        // Insert the user into your custom users table.
        await db.insert(users).values({
          id: data.user.id,
          userName: input.userName ?? input.email,
          email: input.email,
          companyId: input.companyId ?? null,
          role: input.role,
          isSuperAdmin: input.role === "superAdmin",
          dateCreated: new Date(),
        });

        const result = {
          user: data.user,
        };

        // Cache successful signup
        authCache.set(cacheKey, result);

        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
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
      const cacheKey = `signin:${input.email}`;

      // Check cache first
      const cachedResult = authCache.get(cacheKey);
      if (cachedResult) return cachedResult;
      const supabase = createClientServer();

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });

        if (error) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: error.message || "Invalid credentials",
          });
        }

        const result = {
          user: data.user,
          session: data.session,
        };

        // Cache successful signin
        authCache.set(cacheKey, result);

        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),

  // Signout procedure
  signOut: publicProcedure.mutation(async () => {
    try {
      const supabase = createClientServer();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Logout failed",
        });
      }

      // Clear any cached sessions for this user
      authCache.clear();

      return { success: true };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: String(error),
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
        authCache.clear();

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
          },
        });

        console.log("Supabse error found while creating user: ", error);

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

        console.log("Supabase user created:", data);

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

        console.log("User inserted into the custom users table.");

        return { success: true, user: data.user };
      } catch (error) {
        console.error("Error creating super admin:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(error),
        });
      }
    }),
});
