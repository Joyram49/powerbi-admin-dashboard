import { TRPCError } from "@trpc/server";
import { and, eq, isNull, sum } from "drizzle-orm";
import { z } from "zod";

import { db, userSessions } from "@acme/db";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const sessionRouter = createTRPCRouter({
  // this endpoint is create session for new user or update for existing user
  createOrUpdateSession: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    console.log("userId", userId);

    try {
      // First, check if ANY session exists for this user (active or not)
      const anyExistingSession = await db
        .select()
        .from(userSessions)
        .where(eq(userSessions.userId, userId))
        .limit(1);

      if (anyExistingSession.length > 0) {
        // A session exists for this user, update it instead of creating a new one
        const existingSessionId = anyExistingSession[0]?.id ?? "";
        const updatedSession = await db
          .update(userSessions)
          .set({
            startTime: new Date(),
            endTime: null, // Mark as active by clearing end time
            // Don't reset accumulated times
          })
          .where(eq(userSessions.id, existingSessionId))
          .returning();

        return {
          success: true,
          message: "Existing session updated and reactivated",
          data: updatedSession[0],
        };
      }

      // If no session exists at all for this user, create a new one
      const newSession = await db
        .insert(userSessions)
        .values({
          userId,
          startTime: new Date(),
          totalActiveTime: 0,
          totalInactiveTime: 0,
        })
        .returning();

      return {
        success: true,
        message: "New session created successfully",
        data: newSession[0],
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error("Session creation error:", error);

      // Add specific error handling for unique constraint violation
      const pgError = error as { code: string; constraint_name?: string };
      if (
        pgError.code === "23505" &&
        pgError.constraint_name === "user_sessions_user_id_unique"
      ) {
        // If we get here, it means another request created a session in parallel
        // Let's try to get and return the existing session
        try {
          const existingSession = await db
            .select()
            .from(userSessions)
            .where(eq(userSessions.userId, userId))
            .limit(1);

          if (existingSession.length > 0) {
            return {
              success: true,
              message: "Using existing session due to concurrent creation",
              data: existingSession[0],
            };
          }
        } catch (innerError) {
          console.error("Failed to fetch after constraint error:", innerError);
        }
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create or update session",
        cause: error,
      });
    }
  }),

  // this endpoint will update the user session upon pressing signou button
  updateSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        totalActiveTime: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { sessionId, totalActiveTime } = input;
      const userId = ctx.session.user.id;

      try {
        const existingSession = await db
          .select()
          .from(userSessions)
          .where(
            and(
              eq(userSessions.id, sessionId),
              eq(userSessions.userId, userId),
            ),
          )
          .limit(1);

        if (!existingSession.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Session not found",
          });
        }

        const session = existingSession[0];
        const sessionStartTime = session?.startTime;

        if (!sessionStartTime) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Session start time is missing",
          });
        }

        const endTime = new Date();
        const totalSessionTime =
          endTime.getTime() - new Date(sessionStartTime).getTime();
        const totalInactiveTime = totalSessionTime - totalActiveTime;

        // get the previous active and inactive time from database
        const previousActive = session.totalActiveTime;
        const previousInactive = session.totalInactiveTime;

        const newActiveSeconds = Math.floor(totalActiveTime / 1000);
        const newInactiveSeconds = Math.floor(totalInactiveTime / 1000);

        const updatedTotalActive = previousActive + newActiveSeconds;
        const updatedTotalInactive = previousInactive + newInactiveSeconds;

        // Update the session with accumulated active/inactive times
        await db
          .update(userSessions)
          .set({
            endTime,
            totalActiveTime: updatedTotalActive,
            totalInactiveTime: updatedTotalInactive,
          })
          .where(
            and(
              eq(userSessions.id, sessionId),
              eq(userSessions.userId, userId),
            ),
          );

        return { success: true, message: "Session updated successfully" };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update session",
        });
      }
    }),

  // this endpoint will provide the session by userId
  getSessionByUserId: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const session = await db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.userId, userId), isNull(userSessions.endTime)))
      .limit(1);

    return session[0] ?? null;
  }),

  // this endpoint will provide all the sessions
  getAllSessions: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "superAdmin") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not authorized to view all active users",
      });
    }

    try {
      const totalUser = await db.query.userSessions.findMany();

      return totalUser;
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

  // this endpoind will provide the online user
  getActiveUsersCount: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "superAdmin") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not authorized to view all active users",
      });
    }

    try {
      const activeUserCount = await db.query.userSessions.findMany({
        where: isNull(userSessions.endTime),
      });

      return {
        success: true,
        data: activeUserCount.length,
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

  getTotalActiveTime: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "superAdmin") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not allowed to get total active time",
      });
    }

    try {
      const result = await db
        .select({
          total: sum(userSessions.totalActiveTime),
        })
        .from(userSessions);

      const totalActiveTime = result[0]?.total ?? 0;

      return {
        success: true,
        data: totalActiveTime,
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
});
