// app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

import { env } from "~/env";

export default async function RootPage() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () =>
          cookieStore.getAll().map(({ name, value }) => ({ name, value })),
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  } else {
    const role = user.role; // Make sure role is in user_metadata
    const ROLE_ROUTES = {
      superAdmin: "/super-admin",
      admin: "/admin",
      user: "/user",
    };
    redirect(ROLE_ROUTES[role as keyof typeof ROLE_ROUTES] || "/");
  }
}
