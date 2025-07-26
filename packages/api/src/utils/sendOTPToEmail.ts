import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { createClientServer, db, users } from "@acme/db";

export async function sendOTPToEmail(email: string) {
  const supabase = createClientServer();
  const result = await db.select().from(users).where(eq(users.email, email));

  if (result.length === 0) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User does not exist",
    });
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: email,
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

  return true;
}
