import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getUserRole } from "./utils/getUserRole";
import { updateSession } from "./utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  // First handle authentication with Supabase
  const authResponse = await updateSession(request);

  // If the auth middleware redirected (e.g., to login), respect that
  if (authResponse.status !== 200) {
    return authResponse;
  }

  const { pathname } = request.nextUrl;
  const userRole = getUserRole(request);

  // Handle role-based routing for dashboard
  if (pathname.startsWith("/dashboard")) {
    // SUPER_ADMIN can access any route, so no redirection needed
    if (userRole === "SUPER_ADMIN") {
      // If they're at the base dashboard route, redirect to the super-admin dashboard
      if (pathname === "/dashboard") {
        return NextResponse.redirect(
          new URL("/dashboard/super-admin", request.url),
        );
      }
      return authResponse;
    }

    // ADMIN can access admin and user routes
    if (userRole === "ADMIN") {
      if (pathname.startsWith("/dashboard/super-admin")) {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }

      // If they're at the base dashboard route, redirect to the admin dashboard
      if (pathname === "/dashboard") {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url));
      }

      return authResponse;
    }

    // USER can only access user routes
    if (userRole === "USER") {
      if (
        pathname.startsWith("/dashboard/super-admin") ||
        pathname.startsWith("/dashboard/admin")
      ) {
        return NextResponse.redirect(new URL("/dashboard/user", request.url));
      }

      // If they're at the base dashboard route, redirect to the user dashboard
      if (pathname === "/dashboard") {
        return NextResponse.redirect(new URL("/dashboard/user", request.url));
      }

      return authResponse;
    }

    // If no valid role or undefined, default to user dashboard
    if (pathname !== "/dashboard/user") {
      return NextResponse.redirect(new URL("/dashboard/user", request.url));
    }
  }

  return authResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/trpc/.*|api/auth/.*).*)",
  ],
};
