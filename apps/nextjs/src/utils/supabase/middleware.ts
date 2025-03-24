import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { env } from "~/env";
import { PUBLIC_ROUTES, ROLE_ROUTES, ROOT } from "../routes";

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
  const userRole = user?.role; 
  console.log("User role:", userRole);

  // If not logged in and accessing private route → redirect to login
  if (!user && !PUBLIC_ROUTES.includes(pathName) && pathName !== ROOT) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If logged in and visiting a public page → redirect based on role
  if (!!user && PUBLIC_ROUTES.includes(pathName)) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES] || "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
