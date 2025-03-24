import { db, users } from "@acme/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getAllUsers: protectedProcedure.query(async () => {
    try {
      // Fetch users from the database
      const allUsers = await db.select().from(users).limit(10);

      return {
        success: true,
        users: allUsers.map((user) => ({
          id: user.id,
          email: user.email,
          userName: user.userName,
          role: user.role,
        })),
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }),
});
