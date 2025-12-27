import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@acme/api";
import { createClientServer, globalCookieStore } from "@acme/db";

import { env } from "~/env";

// Explicitly set runtime to nodejs (required for database connections)
export const runtime = "nodejs";

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

const baseUrl =
  env.NODE_ENV === "development"
    ? "http://localhost:3000/"
    : env.NEXT_PUBLIC_APP_URL;

// Optimize CORS headers with more specific configuration
const setCorsHeaders = (res: Response) => {
  res.headers.set("Access-Control-Allow-Origin", baseUrl);
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
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const userMetadata = data.user.user_metadata;
      const user = {
        id: data.user.id,
        email: data.user.email,
        userName: userMetadata.userName as string,
        role: userMetadata.role as string,
      };
      session = { user };
    }
  } catch (error) {
    console.error("Session retrieval error:", error);
    // Log the full error details for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  }

  // Get the tRPC response
  const trpcResponse = await fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () => {
      try {
        return createTRPCContext({
          session,
          headers: req.headers,
        });
      } catch (error) {
        console.error("Error creating TRPC context:", error);
        if (error instanceof Error) {
          console.error("Context error message:", error.message);
          console.error("Context error stack:", error.stack);
        }
        throw error;
      }
    },
    onError({ error, path, type }) {
      console.error(
        `>>> tRPC Error on '${path}' (${type})`,
        JSON.stringify(
          {
            message: error.message,
            code: error.code,
            cause: error.cause,
            stack: error.stack,
          },
          null,
          2,
        ),
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

// Export handlers for both GET and POST
// Next.js App Router requires named function exports for route handlers
export async function GET(req: Request) {
  return await createCustomResponseHandler(req);
}

export async function POST(req: Request) {
  return await createCustomResponseHandler(req);
}
