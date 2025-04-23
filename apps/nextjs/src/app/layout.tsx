import type { Metadata, Viewport } from "next";
import React from "react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { cn } from "@acme/ui";
import { ThemeProvider } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { ActivityTracker } from "~/components/ActivityTracker";
import { TRPCReactProvider } from "~/trpc/react";

import "~/app/globals.css";

import { env } from "~/env";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased dark:bg-gray-900",
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
            <ActivityTracker>{children}</ActivityTracker>
          </TRPCReactProvider>

          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}