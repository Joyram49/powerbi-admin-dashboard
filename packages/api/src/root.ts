import { authRouter } from "./router/auth";
import { billingRouter } from "./router/billing";
import { companyRouter } from "./router/company";
import { paymentMethodRouter } from "./router/payment-method";
import { postRouter } from "./router/post";
import { reportRouter } from "./router/report";
import { sessionRouter } from "./router/session";
import { stripeRouter } from "./router/stripe";
import { subscriptionRouter } from "./router/subscription";
import { userRouter } from "./router/user";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  company: companyRouter,
  post: postRouter,
  report: reportRouter,
  user: userRouter,
  session: sessionRouter,
  stripe: stripeRouter,
  subscription: subscriptionRouter,
  paymentMethod: paymentMethodRouter,
  billing: billingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
