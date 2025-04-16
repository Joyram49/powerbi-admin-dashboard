import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import Stripe from "stripe";

import type { AppRouter } from "./root";
import type { Session } from "./trpc";
import { env } from "../env";
import { appRouter } from "./root";
import { createCallerFactory, createTRPCContext } from "./trpc";

/**
 * Create a server-side caller for the tRPC API
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
const createCaller = createCallerFactory(appRouter);

/**
 * Inference helpers for input types
 * @example
 * type PostByIdInput = RouterInputs['post']['byId']
 *      ^? { id: number }
 **/
type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type AllPostsOutput = RouterOutputs['post']['all']
 *      ^? Post[]
 **/
type RouterOutputs = inferRouterOutputs<AppRouter>;

// Initialize Stripe
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export { appRouter, createCaller, createTRPCContext, stripe };
export type { AppRouter, RouterInputs, RouterOutputs, Session };
