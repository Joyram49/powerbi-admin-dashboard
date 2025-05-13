"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  FileText,
  Home,
  KeyRound,
  LogOut,
  Receipt,
  Settings,
  Users,
} from "lucide-react";

import { Sidebar, SidebarTrigger } from "@acme/ui/sidebar";

import { useSessionActivity } from "~/hooks/useSessionActivity";
import { api } from "~/trpc/react";

const navigationItems = {
  superAdmin: [
    {
      href: "/super-admin",
      icon: <Home className="mr-3 h-5 w-5" />,
      label: "Home",
    },
    {
      href: "/super-admin/users",
      icon: <Users className="mr-3 h-5 w-5" />,
      label: "Users",
    },
    {
      href: "/super-admin/reports",
      icon: <FileText className="mr-3 size-5" />,
      label: "Reports",
    },
    {
      href: "/super-admin/billing",
      icon: <Receipt className="mr-3 h-5 w-5" />,
      label: "Billing Portal",
    },
    {
      href: "/super-admin/settings",
      icon: <Settings className="mr-3 h-5 w-5" />,
      label: "Settings",
    },
    {
      href: "/reset-password",
      icon: <KeyRound className="mr-3 h-5 w-5" />,
      label: "Change password",
    },
    {
      href: "#",
      icon: <LogOut className="mr-3 h-5 w-5" />,
      label: "Log Out",
      isLogout: true,
    },
  ],
  admin: [
    {
      href: "/admin",
      icon: <Home className="mr-3 h-5 w-5" />,
      label: "Home",
    },
    {
      href: "/admin/reports",
      icon: <FileText className="mr-3 h-5 w-5" />,
      label: "Reports",
    },
    {
      href: "/admin/billing",
      icon: <CreditCard className="mr-3 h-5 w-5" />,
      label: "Pricing Plans",
    },
    {
      href: "/reset-password",
      icon: <KeyRound className="mr-3 h-5 w-5" />,
      label: "Change password",
    },
    {
      href: "#",
      icon: <LogOut className="mr-3 h-5 w-5" />,
      label: "Log Out",
      isLogout: true,
    },
  ],
  user: [
    {
      href: "/user",
      icon: <Home className="mr-3 h-5 w-5" />,
      label: "Home",
    },
    {
      href: "/reset-password",
      icon: <KeyRound className="mr-3 h-5 w-5" />,
      label: "Change password",
    },
    {
      href: "#",
      icon: <LogOut className="mr-3 h-5 w-5" />,
      label: "Log Out",
      isLogout: true,
    },
  ],
};

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data, isLoading } = api.auth.getProfile.useQuery();
  const userRole = data?.user?.user_metadata.role as string;
  const { updateSession, getSessionId, fetchSession } = useSessionActivity();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const utils = api.useUtils();

  const logoutMutation = api.auth.signOut.useMutation({
    onSuccess: async () => {
      await utils.auth.getProfile.invalidate();
    },
  });

  // This function needs to be used as an onClick handler
  const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoggingOut(true);

    try {
      // Step 1: Try to fetch the session from server first if not in local storage
      let sessionId = await getSessionId(true);

      if (!sessionId) {
        sessionId = await fetchSession();
      }

      // Step 2: Update the session if it exists
      if (sessionId) {
        await updateSession();
      }

      // Clean up activity data in localStorage
      localStorage.removeItem("userActivityData");
      localStorage.removeItem("auth_event_time");
      localStorage.removeItem("session_tracker_id");

      // Step 3: Sign out
      await logoutMutation.mutateAsync();

      // Step 4: Redirect
      router.push("/login");
    } catch (error) {
      console.error("Logout process error:", error);
      setIsLoggingOut(false);
    }
  };
  // Default to user navigation if role is not available
  const items =
    userRole && Object.keys(navigationItems).includes(userRole)
      ? navigationItems[userRole as keyof typeof navigationItems]
      : navigationItems.user;
  // Show loading state while fetching user role or logging out
  if (isLoading || isLoggingOut || !userRole) {
    return (
      <Sidebar className="hidden w-full max-w-64 flex-col bg-slate-900 text-white dark:!border-gray-800 dark:bg-slate-800 lg:flex">
        <div className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/menu_logo_joc.svg"
              alt="JOC Analytics"
              width={100}
              height={100}
            />
          </Link>
          <SidebarTrigger className="size-7 p-1 !text-white hover:bg-slate-800" />
        </div>
        <nav className="flex-1 overflow-y-auto bg-slate-900 py-4">
          <div className="animate-pulse space-y-2 px-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded bg-slate-800"></div>
            ))}
          </div>
        </nav>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="hidden w-full max-w-64 flex-col bg-slate-900 text-white dark:bg-slate-800 lg:flex">
      <div className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/menu_logo_joc.svg"
            alt="JOC Analytics"
            width={100}
            height={100}
          />
        </Link>
        <SidebarTrigger className="size-7 p-1 !text-white hover:bg-slate-800" />
      </div>
      <nav className="flex-1 overflow-y-auto bg-slate-900 py-4">
        {items.map((item, index) =>
          item.isLogout ? (
            <button
              key={index}
              onClick={handleLogout}
              data-sign-out="true"
              className="flex w-full items-center px-4 py-2 text-left text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ) : (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center px-4 py-2 ${
                pathname === item.href
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ),
        )}
      </nav>
    </Sidebar>
  );
}
