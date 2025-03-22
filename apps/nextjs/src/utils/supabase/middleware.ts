import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "~/env";
import { getUserRole } from "../getUserRole";
import { isPublicRoute, ROOT } from "../routes";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  if (!env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options: _options }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isDashboardRoute =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  // Handle authentication redirects
  if (!user && !isPublicRoute(pathname) && pathname !== ROOT) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublicRoute(pathname) && !isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Handle role-based routing for dashboard in both dev and prod
  // In dev mode, this still redirects to appropriate dashboards but doesn't enforce authentication
  if (isDashboardRoute && pathname === "/dashboard" && user) {
    const userRole = getUserRole(request);
    const url = request.nextUrl.clone();

    switch (userRole) {
      case "SUPER_ADMIN":
        url.pathname = "/dashboard/super-admin";
        return NextResponse.redirect(url);
      case "ADMIN":
        url.pathname = "/dashboard/admin";
        return NextResponse.redirect(url);
      case "USER":
      default:
        url.pathname = "/dashboard/user";
        return NextResponse.redirect(url);
    }
  }

  // Access control based on roles - only apply if user is authenticated
  if (isDashboardRoute && user) {
    const userRole = getUserRole(request);
    const url = request.nextUrl.clone();

    if (
      userRole === "USER" &&
      (pathname.startsWith("/dashboard/super-admin") ||
        pathname.startsWith("/dashboard/admin"))
    ) {
      url.pathname = "/dashboard/user";
      return NextResponse.redirect(url);
    }

    if (userRole === "ADMIN" && pathname.startsWith("/dashboard/super-admin")) {
      url.pathname = "/dashboard/admin";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
