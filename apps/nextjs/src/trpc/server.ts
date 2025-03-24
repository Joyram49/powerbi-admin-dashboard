"server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createHydrationHelpers } from "@trpc/react-query/rsc";

import type { AppRouter } from "@acme/api";
import { createCaller, createTRPCContext } from "@acme/api";

import { createQueryClient } from "./query-client";

const createContext = cache(() => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");

  // Get the cookie header
  const allCookies = cookies();
  const cookieHeader = allCookies
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  // Add cookies to the headers
  if (cookieHeader) {
    heads.set("cookie", cookieHeader);
  }

  return createTRPCContext({
    headers: heads,
  });
});

// Memoize query client creation
const getQueryClient = cache(createQueryClient);

const caller = createCaller(createContext);

export const { trpc: api, HydrateClient } = createHydrationHelpers<AppRouter>(
  caller,
  getQueryClient,
);
