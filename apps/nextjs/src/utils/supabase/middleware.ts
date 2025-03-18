import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { env } from "~/env";
import { PUBLIC_ROUTES, ROOT } from "../routes";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
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
    data: { session: user },
  } = await supabase.auth.getSession();

  const pathName = request.nextUrl.pathname;

  if (!user && !PUBLIC_ROUTES.includes(pathName) && pathName !== ROOT) {
    console.log(">>> User:", user);
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (!!user && PUBLIC_ROUTES.includes(pathName)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
