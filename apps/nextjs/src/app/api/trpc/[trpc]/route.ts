import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@acme/api";
import { getSession } from "@acme/auth";

import { env } from "~/env";

// export const runtime = "edge";

// Optimize CORS headers with more specific configuration
const setCorsHeaders = (res: Response) => {
  res.headers.set("Access-Control-Allow-Origin", env.NEXT_PUBLIC_APP_URL);
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  res.headers.set("Access-Control-Max-Age", "86400"); // Cache preflight for 24 hours
};

export const OPTIONS = () => {
  const response = new Response(null, { status: 204 });
  setCorsHeaders(response);
  return response;
};

const handler = async (req: Request) => {
  // Optimize session retrieval with error handling and caching
  let session = null;
  try {
    const { data } = await getSession();
    session = data.session;
  } catch (error) {
    console.error("Session retrieval error:", error);
  }

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () =>
      createTRPCContext({
        session,
        headers: req.headers,
      }),
    onError({ error, path }) {
      console.error(
        `>>> tRPC Error on '${path}'`,
        JSON.stringify(error, null, 2),
      );
    },
  });

  setCorsHeaders(response);
  return response;
};

export { handler as GET, handler as POST };
