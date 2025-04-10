"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  FileText,
  Home,
  KeyRound,
  LogOut,
  Receipt,
  Settings,
  Users,
} from "lucide-react";

import { Sidebar, SidebarTrigger } from "@acme/ui/sidebar";

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
      href: "/super-admin/billing",
      icon: <Receipt className="mr-3 h-5 w-5" />,
      label: "Billing Portal",
    },
    {
      href: "/super-admin/settings",
      icon: <Settings className="mr-3 h-5 w-5" />,
      label: "Settings",
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
  ],
  user: [
    {
      href: "/user",
      icon: <Home className="mr-3 h-5 w-5" />,
      label: "Home",
    },
    {
      href: "/report",
      icon: <FileText className="mr-3 h-5 w-5" />,
      label: "Reports",
    },
  ],
};

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = api.auth.getProfile.useQuery();
  const userRole = data?.user.user_metadata.role as string;

  const logoutMutation = api.auth.signOut.useMutation({
    onSuccess: () => {
      router.push("/login");
    },
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  const items =
    userRole && Object.keys(navigationItems).includes(userRole)
      ? navigationItems[userRole as keyof typeof navigationItems]
      : navigationItems.user;

  return (
    <Sidebar className="hidden w-full max-w-64 flex-col bg-slate-900 text-white dark:bg-slate-800 lg:flex">
      <div className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-4">
        <div className="flex items-center">
          <BarChart3 className="h-6 w-6 text-blue-500" />
          <span className="ml-2 text-xl font-bold text-white">
            JOC Analytics
          </span>
        </div>
        <SidebarTrigger className="size-7 p-1 !text-white hover:bg-slate-800" />
      </div>
      <nav className="flex-1 overflow-y-auto bg-slate-900 py-4">
        {items.map((item, index) => (
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
        ))}

        <Link
          href="/reset-password"
          className={`flex items-center px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white`}
        >
          <KeyRound className="mr-3 h-5 w-5" />
          <span>Change password</span>
        </Link>
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center px-4 py-2 text-left text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5" />
          <span>Log Out</span>
        </button>
      </nav>
    </Sidebar>
  );
}
