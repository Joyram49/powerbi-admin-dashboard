# Cookie Persistence Solution for T3 Turbo Monorepo with tRPC

## Overview

This document describes the comprehensive solution implemented to ensure proper cookie persistence across the T3 Turbo monorepo project, particularly focusing on authentication cookies set by Supabase. The solution addresses several challenges:

1. **Server-Side Cookie Management**: Ensuring cookies set on the server-side are properly sent to the client
2. **tRPC Integration**: Bridging the gap between tRPC procedures and HTTP response cookies
3. **Authentication Flow**: Maintaining persistent authentication sessions across page loads
4. **Sign-Out Functionality**: Properly clearing cookies when users sign out

## Core Problem

The primary issue stemmed from a fundamental limitation in Next.js and tRPC:

- Next.js's `cookies()` API is designed primarily for Server Components and doesn't automatically attach cookies to API responses
- tRPC doesn't have direct access to the HTTP response to set cookies
- Supabase sets authentication cookies via a callback function, but these aren't automatically synchronized with the response

This resulted in authentication cookies not being properly sent to the browser, causing authentication state to be lost.

## Solution Architecture

### 1. Global Cookie Store

```typescript
// packages/db/src/supabase/server.ts
export const globalCookieStore: Record<
  string,
  { value: string; options: Record<string, any> }
> = {};
```

A global cookie store was implemented to track cookies set by Supabase. This store acts as an intermediary, storing cookie information that can be later accessed when forming the HTTP response.

### 2. Enhanced Supabase Client Creation

```typescript
// packages/db/src/supabase/server.ts
export function createClientServer() {
  try {
    const cookieStore = cookies();

    return createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                // Set with minimal options to avoid conflicts
                cookieStore.set({
                  name,
                  value,
                  path: "/",
                  maxAge: 60 * 60 * 4,
                });

                // Also store in global store for retrieval
                globalCookieStore[name] = {
                  value,
                  options: {
                    path: "/",
                    maxAge: 60 * 60 * 4,
                    ...options,
                  },
                };
              });
            } catch (err) {
              console.error(
                "Error setting cookies:",
                err instanceof Error ? err.message : String(err),
              );
            }
          },
        },
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          debug: true,
        },
      },
    );
  } catch (err) {
    console.error(
      "Error creating server client:",
      err instanceof Error ? err.message : String(err),
    );
    throw new Error("Failed to create server client");
  }
}
```

The Supabase client creation was enhanced to:

- Store cookies in both the Next.js cookie store and our global cookie store
- Enable session persistence and token refresh
- Include detailed error logging

### 3. Custom tRPC Response Handler

```typescript
// apps/nextjs/src/app/api/trpc/[trpc]/route.ts
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

  // Copy all cookies from the global store to the response
  Object.entries(globalCookieStore).forEach(([name, { value, options }]) => {
    response.cookies.set({
      name,
      value,
      path: "/",
      maxAge: 60 * 60 * 4,
      sameSite: "lax",
      httpOnly: false,
      ...options,
    });
  });

  // Also check the cookie store directly
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  allCookies.forEach((cookie) => {
    if (cookie.name.includes("supabase") || cookie.name.includes("auth")) {
      // Only set if not already set from global store
      if (!globalCookieStore[cookie.name]) {
        response.cookies.set({
          name: cookie.name,
          value: cookie.value,
          path: "/",
          maxAge: 60 * 60 * 4,
          sameSite: "lax",
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
```

The custom response handler:

1. Creates a Supabase client that populates the global cookie store
2. Processes the tRPC request
3. Creates a NextResponse from the tRPC response
4. Copies cookies from the global store to the response
5. Checks the NextJS cookie store for any cookies missed
6. Sets proper CORS headers
7. Returns the response with all cookies attached

### 4. Enhanced tRPC Context

```typescript
// packages/api/src/trpc.ts
export const createTRPCContext = async (opts: {
  headers: Headers;
  session?: Session | null;
}): Promise<{
  session: Session | null;
  db: typeof db;
  headers: Headers;
}> => {
  const session = opts.session ?? (await isomorphicGetSession(opts.headers));

  return {
    session,
    db,
    headers: opts.headers, // Include headers in the context
  };
};
```

The tRPC context was updated to include the request headers, allowing procedures to access header information if needed.

### 5. Proper CORS Configuration

```typescript
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
```

CORS headers were properly configured to:

- Allow cookies in cross-origin requests with `credentials: true`
- Define acceptable HTTP methods
- Set appropriate cache durations

### 6. Dedicated Sign-Out Endpoint

```typescript
// apps/nextjs/src/app/api/auth/sign-out/route.ts
export async function POST() {
  try {
    // Create a response
    const response = NextResponse.json(
      { success: true, message: "Signed out successfully" },
      { status: 200 },
    );

    // Create Supabase client
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          /* ... cookie handlers ... */
        },
      },
    );

    // Call Supabase sign out
    const { error } = await supabase.auth.signOut({ scope: "global" });

    // Extract the Supabase project reference from the URL
    const urlMatch = env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)/);
    const projectRef = urlMatch ? urlMatch[1] : "sb";

    // Get all auth-related cookie names
    const authCookies = getAuthCookieNames(projectRef);

    // Explicitly delete all auth cookies
    authCookies.forEach((cookieName) => {
      // Delete cookie with project prefix
      response.cookies.delete(cookieName);

      // Also set an expired cookie to ensure it's deleted
      response.cookies.set({
        name: cookieName,
        value: "",
        expires: new Date(0),
        path: "/",
      });
    });

    return response;
  } catch (error) {
    console.error(
      "Sign-out error:",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      { success: false, message: "Server error during sign-out" },
      { status: 500 },
    );
  }
}
```

A dedicated sign-out endpoint was created to properly clear cookies, which:

1. Signs out the user in Supabase
2. Identifies all potential auth cookie names
3. Explicitly deletes each cookie
4. Sets cookies with expired dates to ensure client deletion

### 7. Client-Side Sign-Out Button

```typescript
// apps/nextjs/src/app/(dashboard)/dashboard/SignOutButton.tsx
export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const trpcSignOut = api.auth.signOut.useMutation();

  const handleSignOut = async () => {
    try {
      setLoading(true);

      // First, call the tRPC endpoint
      await trpcSignOut.mutateAsync();

      // Then call our dedicated endpoint
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });

      // Clear local storage as well
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.removeItem("supabase.auth.token");

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign-out error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleSignOut} className="rounded-md bg-red-600 px-4 py-2 text-white">
      {loading ? "Signing out..." : "Sign Out"}
    </button>
  );
}
```

The sign-out button component implements the complete sign-out process:

1. Calling the tRPC endpoint
2. Calling the dedicated sign-out endpoint
3. Clearing local storage
4. Redirecting to the login page

### 8. Direct Authentication Endpoint

```typescript
// apps/nextjs/src/app/api/auth/direct-signin/route.ts
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Create a response object
    const response = new NextResponse(JSON.stringify({ success: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    // Create Supabase client with cookie handler
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookies().getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Set cookies directly on the response
              response.cookies.set({
                name,
                value,
                path: "/",
                maxAge: 60 * 60 * 4,
                sameSite: "lax",
                httpOnly: false,
                ...options,
              });
            });
          },
        },
      },
    );

    // Sign in using Supabase
    const signInResult = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInResult.error) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication failed",
        },
        { status: 401 },
      );
    }

    // Return success with session data
    return NextResponse.json(
      {
        success: true,
        user: signInResult.data.session?.user || null,
        message: "Successfully signed in",
      },
      {
        status: 200,
        headers: response.headers,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Server error during authentication",
      },
      { status: 500 },
    );
  }
}
```

A direct authentication endpoint was created as an alternative to the tRPC approach, demonstrating:

1. Direct use of NextResponse for cookie handling
2. Supabase client configuration with cookie handlers
3. Proper response formatting with cookies

## Testing the Solution

To test the cookie persistence solution:

1. **Login Flow**:

   - Use the direct login form to verify cookies are being set
   - Check browser developer tools (Application > Storage > Cookies)
   - Verify that auth cookies are present after login

2. **Session Persistence**:

   - Reload the page after login
   - Verify that the authenticated state is maintained
   - Check that protected routes remain accessible

3. **Logout Flow**:
   - Use the Sign Out button
   - Verify cookies are properly removed
   - Check that the user is redirected to the login page
   - Verify protected routes are no longer accessible

## Technical Implementation Details

### Cookie Configuration

Key cookie settings for proper browser handling:

```typescript
{
  path: "/",             // Make cookie available across all paths
  sameSite: "lax",       // Allow cookies in same-site navigation
  secure: false,         // Allow HTTP in development (true in production)
  httpOnly: false,       // Allow JavaScript access to auth cookies
  maxAge: 60 * 60 * 4, // =4 hour expiration
}
```

### Error Handling

The solution implements robust error handling throughout:

- Type checking with optional chaining (`?.`) for null safety
- Try/catch blocks around all asynchronous operations
- Consistent error formatting with `error instanceof Error ? error.message : String(error)`
- Detailed console logging for debugging

### Security Considerations

- Cookies are not marked as HttpOnly to allow client-side access
- In production, cookies should be marked as Secure
- SameSite is set to "lax" to allow cross-site POST requests with cookies
- CORS is configured to allow credentials while restricting origins

## Conclusion

This comprehensive solution ensures proper cookie persistence across the T3 Turbo monorepo project by:

1. Implementing a global cookie store for tracking
2. Creating custom response handlers for tRPC endpoints
3. Using NextResponse for direct cookie manipulation
4. Providing explicit cookie clearing during sign-out
5. Handling both server-side and client-side cookie management

The approach bridges the gap between Next.js's server components, tRPC's typesafe APIs, and Supabase's authentication, ensuring a seamless authentication experience across the application.
