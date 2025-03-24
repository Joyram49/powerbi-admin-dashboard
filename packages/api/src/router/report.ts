import { createClientServer } from "@acme/db";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const reportRouter = createTRPCRouter({
  printHello: publicProcedure.query(async () => {
    const supabase = createClientServer();
    const user = await supabase.auth.getUser();
    console.log("Hello everyone");
    return user;
  }),
});
