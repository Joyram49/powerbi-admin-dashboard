import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { createClientServer } from "@acme/auth";
import { db } from "@acme/db";

// Memoize session to reduce unnecessary lookups
const sessionCache = new Map<string, Session | null>();

export interface Session {
  user: {
    id: string;
    email?: string;
  } | null;
}

const isomorphicGetSession = async (
  headers: Headers,
): Promise<Session | null> => {
  const cacheKey = headers.get("authorization") ?? "default";

  // Check cache first
  if (sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey) ?? null;
  }
  const supabase = createClientServer();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      sessionCache.set(cacheKey, null);
      return null;
    }

    const processedSession = {
      user: {
        id: session.user.id,
        email: session.user.email,
      },
    };

    // Cache the session
    sessionCache.set(cacheKey, processedSession);

    return processedSession;
  } catch (error) {
    console.error("Session retrieval error:", error);
    return null;
  }
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

export const createTRPCContext = async (opts: {
  headers: Headers;
  session?: Session | null;
}): Promise<{
  session: Session | null;
  db: typeof db;
}> => {
  const session = opts.session ?? (await isomorphicGetSession(opts.headers));

  return {
    session,
    db,
  };
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  }),
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

// Middleware to reduce overhead
const performanceMiddleware = t.middleware(async ({ next, path }) => {
  const start = performance.now();
  const result = await next();
  const duration = performance.now() - start;

  // Only log if execution takes more than 500ms
  if (duration > 500) {
    console.log(`[TRPC] ${path} took ${duration.toFixed(2)}ms`);
  }

  return result;
});

export const publicProcedure = t.procedure.use(performanceMiddleware);

export const protectedProcedure = t.procedure
  .use(performanceMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }
    return next({
      ctx: {
        session: {
          user: ctx.session.user,
        },
      },
    });
  });
