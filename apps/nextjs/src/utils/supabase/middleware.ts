import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { env } from "~/env";
import { LOGIN, PRIVATE_ROUTES, PUBLIC_ROUTES, ROLE_ROUTES } from "../routes";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathName = request.nextUrl.pathname;
  const userRole = user?.user_metadata.role as string | undefined;

  // Scenario 1: Allow access to explicit public routes
  if (PUBLIC_ROUTES.includes(pathName)) {
    // If user is logged in and trying to access login page, redirect to role-based route
    if (pathName === LOGIN && user && userRole) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES] || LOGIN;
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Scenario 2: Always redirect to login if accessing root path and not authenticated
  if (pathName === "/" && !user) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN;
    return NextResponse.redirect(url);
  }

  // Scenario 3: Redirect to role-specific route if accessing root path and authenticated
  if (pathName === "/" && user && userRole) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES] || LOGIN;
    return NextResponse.redirect(url);
  }

  // Scenario 4: Redirect to login if user role is undefined/null
  if (user && (!userRole || userRole.trim() === "")) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN;
    return NextResponse.redirect(url);
  }

  // Scenario 5: Check if the current path is a role-based route
  const isRoleBasedRoute = Object.values(
    ROLE_ROUTES as { [K in keyof typeof ROLE_ROUTES]: string },
  ).some((route) => pathName.startsWith(route));

  // If it's a role-based route and user is not authenticated, redirect to login
  if (isRoleBasedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN;
    return NextResponse.redirect(url);
  }

  // Scenario 6: Redirect to login if not authenticated and trying to access private routes
  const isPrivateRoute = PRIVATE_ROUTES.some((route) =>
    pathName.startsWith(route),
  );
  if (!user && isPrivateRoute) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN;
    return NextResponse.redirect(url);
  }

  // Scenario 7: Prevent access to routes not matching user's role
  if (user && userRole) {
    const isPrivateRoute = PRIVATE_ROUTES.some((route) =>
      pathName.startsWith(route),
    );

    const isAuthorizedRoute = Object.entries(ROLE_ROUTES).some(
      ([role, routePrefix]) =>
        role === userRole && pathName.startsWith(routePrefix as string),
    );

    // Only redirect if it's not a private route AND not an authorized route
    if (!isPrivateRoute && !isAuthorizedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES] || LOGIN;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
