import type { Metadata, Viewport } from "next";
import React, { Suspense } from "react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { cn } from "@acme/ui";
import { ThemeProvider } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { TRPCReactProvider } from "~/trpc/react";

import "~/app/globals.css";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "~/env";
import Loading from "./_components/Loader";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://turbo.t3.gg"
      : "http://localhost:3000",
  ),
  title: "JOC Analytics",
  description: "Simple monorepo with shared backend for web & mobile apps",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // Prepare user role
  const userRole = user?.user_metadata.role as string | undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>
            <Suspense fallback={<Loading />}>
              {React.Children.map(children, (child) =>
                React.isValidElement(child) && userRole
                  ? React.cloneElement(child as React.ReactElement, {
                      userRole,
                    })
                  : child,
              )}
            </Suspense>
          </TRPCReactProvider>
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
