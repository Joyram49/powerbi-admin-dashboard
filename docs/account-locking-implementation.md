# Account Locking Implementation Guide

This document outlines how to implement an account locking mechanism after multiple failed login attempts using Supabase Auth and tRPC.

## Overview

The implementation consists of:

1. A database table to track login attempts
2. Enhanced authentication logic to count and limit failed attempts
3. Account unlock functionality via email OTP verification
4. UI components to handle and communicate lock states

## 1. Database Schema

First, add a new table to track login attempts:

```typescript
// In packages/db/schema.ts
export const loginAttempts = createTable("login_attempts", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  attempts: integer("attempts").notNull().default(0),
  lastAttempt: timestamp("last_attempt").notNull().defaultNow(),
  isLocked: boolean("is_locked").notNull().default(false),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

## 2. Enhanced Authentication Logic

Modify the `signIn` procedure to track login attempts:

```typescript
// In packages/api/src/router/auth.ts
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
      // Check if account is locked
      const lockRecord = await db
        .select()
        .from(loginAttempts)
        .where(eq(loginAttempts.email, input.email))
        .limit(1);

      const now = new Date();

      // Check if account is locked
      if (
        lockRecord.length > 0 &&
        lockRecord[0].isLocked &&
        lockRecord[0].lockedUntil &&
        lockRecord[0].lockedUntil > now
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
        lockRecord.length > 0 &&
        lockRecord[0].isLocked &&
        lockRecord[0].lockedUntil &&
        lockRecord[0].lockedUntil <= now
      ) {
        await db
          .update(loginAttempts)
          .set({
            isLocked: false,
            attempts: 0,
            updatedAt: now,
          })
          .where(eq(loginAttempts.email, input.email));
      }

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      // If login failed, record the attempt
      if (error) {
        // Update or create the login attempts record
        if (lockRecord.length > 0) {
          const attempts = lockRecord[0].attempts + 1;
          const MAX_ATTEMPTS = 5;
          const LOCK_DURATION_MINUTES = 30;

          // Check if we need to lock the account
          if (attempts >= MAX_ATTEMPTS) {
            const lockedUntil = new Date();
            lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCK_DURATION_MINUTES);

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

        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: error.message || "Authentication failed",
        });
      }

      // If login successful, reset attempts
      if (lockRecord.length > 0) {
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
        user: data.user,
        session: data.session,
      };
    } catch (err) {
      // Error handling code...
    }
  }),
```

## 3. Account Unlock Functionality

Add two new endpoints for account unlock flow:

```typescript
// Send OTP to unlock account
sendUnlockOTP: publicProcedure
  .input(
    z.object({
      email: z.string().email({ message: "Invalid email address" }),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const supabase = createClientServer();

      // Check if the account is actually locked
      const lockRecord = await db
        .select()
        .from(loginAttempts)
        .where(eq(loginAttempts.email, input.email))
        .limit(1);

      if (lockRecord.length === 0 || !lockRecord[0].isLocked) {
        return {
          success: false,
          message: "Account is not locked",
        };
      }

      // Verify the user exists
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email));

      if (result.length === 0) {
        return {
          success: false,
          message: "User does not exist",
        };
      }

      // Send OTP for account unlock
      const { error } = await supabase.auth.signInWithOtp({
        email: input.email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        return {
          success: false,
          message: error.message || "Failed to send unlock code",
        };
      }

      return {
        success: true,
        message: "Unlock code sent successfully",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send unlock code";
      return {
        success: false,
        message: errorMessage,
      };
    }
  }),

// Unlock account procedure (through OTP verification)
unlockAccount: publicProcedure
  .input(
    z.object({
      email: z.string().email({ message: "Invalid email address" }),
      token: z.string().length(6),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const supabase = createClientServer();

      // First, verify OTP
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

      // Then unlock the account
      const now = new Date();
      await db
        .update(loginAttempts)
        .set({
          attempts: 0,
          isLocked: false,
          lockedUntil: null,
          updatedAt: now,
        })
        .where(eq(loginAttempts.email, input.email));

      return {
        success: true,
        message: "Account unlocked successfully",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to unlock account";
      return {
        success: false,
        message: errorMessage,
      };
    }
  }),
```

## 4. UI Implementation

### 4.1 Account Unlock Page

Create a new page to handle account unlocking:

```typescript
// In apps/nextjs/src/app/(auth)/unlock-account/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { api } from "~/trpc/react";

const emailSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),
});

const otpSchema = z.object({
  token: z
    .string()
    .length(6, { message: "OTP code must be 6 characters" }),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

function UnlockAccountPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  // Setup form with react-hook-form (email step)
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  // Setup form with react-hook-form (OTP step)
  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: otpErrors },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      token: "",
    },
  });

  // Send unlock OTP mutation
  const sendUnlockOTP = api.auth.sendUnlockOTP.useMutation({
    onSuccess: (response) => {
      if (response.success) {
        setStep("otp");
        setErrorMessage(null);
      } else {
        setErrorMessage(response.message || "Failed to send unlock code");
      }
      setIsSubmitting(false);
    },
    onError: (error) => {
      setErrorMessage(error.message || "Something went wrong. Please try again.");
      setIsSubmitting(false);
    },
  });

  // Unlock account mutation
  const unlockAccount = api.auth.unlockAccount.useMutation({
    onSuccess: (response) => {
      if (response.success) {
        setIsSuccess(true);
        setErrorMessage(null);
      } else {
        setErrorMessage(response.message || "Failed to unlock account");
      }
      setIsSubmitting(false);
    },
    onError: (error) => {
      setErrorMessage(error.message || "Something went wrong. Please try again.");
      setIsSubmitting(false);
    },
  });

  // Handle email form submission
  const onEmailSubmit = async (data: EmailFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setEmail(data.email);

    try {
      await sendUnlockOTP.mutateAsync({ email: data.email });
    } catch (err) {
      // Error is handled in the mutation callbacks
      console.error(err);
    }
  };

  // Handle OTP form submission
  const onOtpSubmit = async (data: OtpFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await unlockAccount.mutateAsync({ email, token: data.token });
    } catch (err) {
      // Error is handled in the mutation callbacks
      console.error(err);
    }
  };

  // Success state UI
  if (isSuccess) {
    return (
      <div className="rounded-md bg-green-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-green-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Account unlocked successfully
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                Your account has been unlocked. You can now log in with your credentials.
              </p>
              <div className="mt-4">
                <a
                  href="/login"
                  className="inline-flex items-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Go to Login
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Two-step form UI (email step or OTP step)
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Unlock your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === "email"
            ? "Enter your email to receive an unlock code"
            : "Enter the 6-digit code sent to your email"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          {/* Error message display */}
          {errorMessage && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{errorMessage}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email step form */}
          {step === "email" ? (
            <form onSubmit={handleSubmitEmail(onEmailSubmit)} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...registerEmail("email")}
                    className={`block w-full rounded-md border px-3 py-2 ${
                      emailErrors.email
                        ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:outline-none focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                  />
                  {emailErrors.email && (
                    <p className="mt-2 text-sm text-red-600">
                      {emailErrors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isSubmitting ? "Sending..." : "Send Unlock Code"}
                </button>
              </div>
            </form>
          ) : (
            /* OTP step form */
            <form onSubmit={handleSubmitOtp(onOtpSubmit)} className="space-y-6">
              <div>
                <label
                  htmlFor="token"
                  className="block text-sm font-medium text-gray-700"
                >
                  6-Digit Code
                </label>
                <div className="mt-1">
                  <input
                    id="token"
                    type="text"
                    maxLength={6}
                    {...registerOtp("token")}
                    className={`block w-full rounded-md border px-3 py-2 ${
                      otpErrors.token
                        ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:outline-none focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                  />
                  {otpErrors.token && (
                    <p className="mt-2 text-sm text-red-600">
                      {otpErrors.token.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Back to email
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isSubmitting ? "Verifying..." : "Unlock Account"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default UnlockAccountPage;
```

### 4.2 Update Login Page

Update your login page to detect lock errors and provide a link to the unlock account page:

```typescript
// In your login/signin page, add:

// Detect if the error is related to account locking
const isAccountLocked = errorMessage?.includes("Account locked") ||
                        errorMessage?.includes("Too many failed login attempts");

// In the error message display section, add:
{isAccountLocked && (
  <p className="mt-2">
    <a
      href="/unlock-account"
      className="font-medium text-red-700 underline hover:text-red-600"
    >
      Unlock your account
    </a>
  </p>
)}
```

## 5. Implementation Steps

1. **Update Database Schema**:

   - Add the `loginAttempts` table to your database schema
   - Run migrations to create the table

2. **Backend Implementation**:

   - Add the enhanced `signIn` procedure to track login attempts
   - Add the `sendUnlockOTP` and `unlockAccount` endpoints
   - Update imports in the router file

3. **UI Implementation**:

   - Create the unlock account page with the two-step verification process
   - Update the login page to handle lock errors and provide a link to the unlock page

4. **Testing**:
   - Test the login flow with incorrect credentials (5+ times) to trigger account locking
   - Test the unlock flow to verify it properly restores account access
   - Test automatic unlocking after the lock period expires

## Configuration Options

You can adjust these constants in the `signIn` procedure to customize the locking behavior:

```typescript
const MAX_ATTEMPTS = 5; // Number of failed attempts before locking
const LOCK_DURATION_MINUTES = 30; // Duration of the lock in minutes
```

## Security Considerations

1. **Rate Limiting**: Consider adding rate limiting to the unlock endpoints to prevent abuse
2. **Logging**: Implement logging for security events like account locks and unlocks
3. **Notification**: Consider notifying users by email when their account is locked
4. **Admin Override**: Create an admin interface to manually unlock accounts if needed

## Conclusion

This implementation provides a balance between security and user experience by:

1. Preventing brute force attacks through account locking
2. Providing a self-service recovery mechanism
3. Automatically unlocking accounts after a cooling-off period
4. Using secure OTP verification for account recovery
