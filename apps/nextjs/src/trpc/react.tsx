"use client";

import type { QueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { loggerLink, unstable_httpBatchStreamLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import SuperJSON from "superjson";

import type { AppRouter } from "@acme/api";

import { env } from "~/env";
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient();
  } else {
    return (clientQueryClientSingleton ??= createQueryClient());
  }
};

export const api = createTRPCReact<AppRouter>();

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = useMemo(() => getQueryClient(), []);

  const trpcClient = useMemo(
    () =>
      api.createClient({
        links: [
          loggerLink({
            enabled: (op) =>
              env.NODE_ENV === "development" ||
              (op.direction === "down" && op.result instanceof Error),
          }),
          unstable_httpBatchStreamLink({
            transformer: SuperJSON,
            url: getBaseUrl() + "/api/trpc",
            headers() {
              const headers = new Headers();
              headers.set("x-trpc-source", "nextjs-react");
              headers.set("timeout", "10000"); // 10 seconds timeout

              // Print current cookies for debugging
              if (typeof window !== "undefined") {
                console.log(
                  "Current cookies when making tRPC request:",
                  document.cookie,
                );
              }

              return headers;
            },
            // Enhanced fetch options
            async fetch(url, options) {
              // Log request for debugging
              console.log(`tRPC fetch to ${url.href}`);

              // Make the fetch with credentials included
              return fetch(url, {
                ...options,
                credentials: "include", // Important: This ensures cookies are sent with the request
              }).then((response) => {
                // Log response cookies for debugging
                console.log("tRPC response received");
                if (typeof window !== "undefined") {
                  // Check if cookies were set after the response
                  setTimeout(() => {
                    console.log(
                      "Cookies after tRPC response:",
                      document.cookie,
                    );
                  }, 100); // Small delay to ensure cookies are processed
                }
                return response;
              });
            },
          }),
        ],
      }),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
}

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  return `http://localhost:${env.PORT ?? 3000}`;
};
