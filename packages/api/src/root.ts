import { authRouter } from "./router/auth";
import { companyRouter } from "./router/company";
import { postRouter } from "./router/post";
import { reportRouter } from "./router/report";
import { sessionRouter } from "./router/session";
import { userRouter } from "./router/user";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  company: companyRouter,
  post: postRouter,
  report: reportRouter,
  user: userRouter,
  session: sessionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
