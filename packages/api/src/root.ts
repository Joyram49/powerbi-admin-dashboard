import { authRouter } from "./router/auth";
import { postRouter } from "./router/post";
import { reportRouter } from "./router/report";
import { userRouter } from "./router/user";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  post: postRouter,
  report: reportRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
