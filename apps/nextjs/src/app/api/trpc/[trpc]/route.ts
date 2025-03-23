import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createTRPCContext } from "@acme/api";
import { createClientServer, globalCookieStore } from "@acme/db";
import { env } from "~/env";

// Define local interfaces to match the structure from server.ts
interface CookieOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  expires?: Date;
}

interface StoredCookie {
  value: string;
  options: CookieOptions;
}

// Optimize CORS headers with more specific configuration
const setCorsHeaders = (res: Response) => {
  res.headers.set("Access-Control-Allow-Origin", env.NEXT_PUBLIC_APP_URL);
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Max-Age", "86400"); // Cache preflight for 24 hours
};

export const OPTIONS = () => {
  const response = new Response(null, { status: 204 });
  setCorsHeaders(response);
  return response;
};

// Custom fetch handler that wraps the tRPC handler
const createCustomResponseHandler = async (req: Request) => {
  // Create a Response object first, which lets us track cookies in the globalCookieStore
  let session = null;

  try {
    const supabase = createClientServer();
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch (error) {
    console.error("Session retrieval error:", error);
  }

  // Get the tRPC response
  const trpcResponse = await fetchRequestHandler({
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

  // Create a NextResponse from the tRPC response
  const responseData = await trpcResponse.text();
  const response = new NextResponse(responseData, {
    status: trpcResponse.status,
    statusText: trpcResponse.statusText,
    headers: trpcResponse.headers,
  });

  // Use typed object for global cookie store to fix TypeScript errors
  const typedCookieStore = globalCookieStore as unknown as Record<
    string,
    StoredCookie
  >;

  // Use Object.entries in a type-safe way
  Object.keys(typedCookieStore).forEach((name) => {
    // Access from typed store
    const cookieData = typedCookieStore[name];
    if (cookieData && typeof cookieData.value === "string") {
      // Define cookie options with the expected ResponseCookie type structure
      const cookieOptions: Partial<ResponseCookie> = {
        name,
        value: cookieData.value,
        path: cookieData.options.path ?? "/",
        maxAge: cookieData.options.maxAge ?? 60 * 60 * 4,
        // Use type assertion for string literal
        sameSite: cookieData.options.sameSite ?? "lax",
        httpOnly: Boolean(cookieData.options.httpOnly),
        secure: Boolean(cookieData.options.secure),
      };

      // Add optional properties only if they exist
      if (cookieData.options.domain)
        cookieOptions.domain = cookieData.options.domain;
      if (cookieData.options.expires)
        cookieOptions.expires = cookieData.options.expires;

      response.cookies.set(cookieOptions as ResponseCookie);
    }
  });

  // Also check the cookie store directly
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  allCookies.forEach((cookie) => {
    if (cookie.name.includes("supabase") || cookie.name.includes("auth")) {
      // Only set if not already set from global store
      if (!typedCookieStore[cookie.name]) {
        response.cookies.set({
          name: cookie.name,
          value: cookie.value,
          path: "/",
          maxAge: 60 * 60 * 4,
          sameSite: "lax" as const,
          httpOnly: false,
        });
      }
    }
  });

  // Add CORS headers
  setCorsHeaders(response);
  return response;
};

// Use the custom handler for both GET and POST
export const GET = createCustomResponseHandler;
export const POST = createCustomResponseHandler;
