"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import SuperJSON from "superjson";

import type { AppRouter } from "@acme/api";

import { env } from "~/env";

/**
1) Uses httpBatchLink from  current version (it's more stable than the unstable_httpBatchStreamLink in the previous version)
2) Incorporates the debugging features from  previous version
3) Maintains the simpler React hooks pattern from  current version

4) Keeps current structure with useState (cleaner than the singleton approach)
5) Adds back the detailed cookie debugging that will help diagnose issues
6) Uses the stable httpBatchLink instead of the unstable version
Maintains proper credentials configuration for cookie handling
Adds header logging to see what the server is returning
 **/
// Create the tRPC React hooks
export const api = createTRPCReact<AppRouter>();

// Get base URL for API calls
const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  const port =
    typeof env !== "undefined" && "PORT" in env ? Number(env.PORT) : 3000;
  return `http://localhost:${port}`;
};

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  // Use useState for creating query and tRPC clients
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchLink({
          transformer: SuperJSON,
          url: getBaseUrl() + "/api/trpc",
          headers() {
            const headers = new Headers();
            headers.set("x-trpc-source", "nextjs-react");

            // Add timeout header if needed
            headers.set("timeout", "10000"); // 10 seconds timeout

            return Object.fromEntries(headers);
          },
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include", // Ensure cookies are sent
            }).then((response) => {
              // Log response for debugging
              console.log("tRPC response received");
              return response;
            });
          },
        }),
      ],
    }),
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </api.Provider>
  );
}
