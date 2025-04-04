import type { TRPCRouterRecord } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { Post } from "@acme/db";
import { createPostSchema, posts } from "@acme/db";

import { protectedProcedure, publicProcedure } from "../trpc";

export const postRouter = {
  all: publicProcedure.query(async ({ ctx }): Promise<Post[]> => {
    return ctx.db.select().from(posts).orderBy(desc(posts.id)).limit(10);
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<Post | null> => {
      const result = await ctx.db
        .select()
        .from(posts)
        .where(eq(posts.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insert(posts).values(input).returning();
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.db.delete(posts).where(eq(posts.id, input)).returning();
    }),
} satisfies TRPCRouterRecord;
