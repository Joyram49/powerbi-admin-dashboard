"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  Building,
  FileText,
  Home,
  KeyRound,
  LogOut,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@acme/ui/avatar";
import { ThemeToggle } from "@acme/ui/theme";

// Animation Variants
const sidebarVariants = {
  hidden: { x: -250, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeInOut" },
  },
};

export default function DashboardLayout({
  children,
  userRole = "USER", // Default to lowest permission level if not specified
}: {
  children: React.ReactNode;
  userRole: string | undefined;
}) {
  // Navigation items based on user role
  const navigationItems = {
    superAdmin: [
      {
        href: "/dashboard/super-admin",
        icon: <Home className="mr-3 h-5 w-5" />,
        label: "Home",
      },
      {
        href: "/dashboard/super-admin/companies",
        icon: <Building className="mr-3 h-5 w-5" />,
        label: "Company List",
      },
      {
        href: "/dashboard/super-admin/companies/add",
        icon: <UserPlus className="mr-3 h-5 w-5" />,
        label: "Add Company",
      },
      {
        href: "/dashboard/super-admin/users",
        icon: <Users className="mr-3 h-5 w-5" />,
        label: "Users List",
      },
      {
        href: "/auth/change-password",
        icon: <KeyRound className="mr-3 h-5 w-5" />,
        label: "Change Password",
      },
      {
        href: "/auth/logout",
        icon: <LogOut className="mr-3 h-5 w-5" />,
        label: "Log Out",
      },
    ],
    admin: [
      {
        href: "/dashboard/admin",
        icon: <Home className="mr-3 h-5 w-5" />,
        label: "Home",
      },
      {
        href: "/dashboard/admin/reports",
        icon: <FileText className="mr-3 h-5 w-5" />,
        label: "Report List",
      },
      {
        href: "/dashboard/admin/users",
        icon: <Users className="mr-3 h-5 w-5" />,
        label: "Users List",
      },
      {
        href: "/dashboard/admin/users/add",
        icon: <UserPlus className="mr-3 h-5 w-5" />,
        label: "Add User",
      },
      {
        href: "/auth/change-password",
        icon: <KeyRound className="mr-3 h-5 w-5" />,
        label: "Change Password",
      },
      {
        href: "/auth/logout",
        icon: <LogOut className="mr-3 h-5 w-5" />,
        label: "Log Out",
      },
    ],
    user: [
      {
        href: "/dashboard/user",
        icon: <Home className="mr-3 h-5 w-5" />,
        label: "Home",
      },
      {
        href: "/dashboard/user/reports",
        icon: <FileText className="mr-3 h-5 w-5" />,
        label: "Reports",
      },
      {
        href: "/auth/change-password",
        icon: <KeyRound className="mr-3 h-5 w-5" />,
        label: "Change Password",
      },
      {
        href: "/auth/logout",
        icon: <LogOut className="mr-3 h-5 w-5" />,
        label: "Log Out",
      },
    ],
  };

  // Get current path for active link styling
  const pathname = usePathname();

  const items = navigationItems[userRole as keyof typeof navigationItems];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-950">
      {/* Sidebar */}
      <motion.aside
        className="hidden w-64 flex-col bg-slate-900 text-white dark:bg-slate-800 md:flex"
        initial="hidden"
        animate="visible"
        variants={sidebarVariants}
      >
        <div className="flex h-16 items-center border-b border-slate-800 px-4">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-blue-500" />
            <span className="ml-2 text-xl font-bold">JOC Analytics</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {items.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`flex items-center px-4 py-2 ${
                pathname === item.href
                  ? "bg-slate-800 text-white dark:bg-slate-700"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </motion.aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-xl font-semibold dark:text-white">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {/* Only show Add Company button for super_admin */}
                {userRole === "superAdmin" && (
                <motion.button
                  className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <a
                    href="/dashboard/super-admin/companies/add"
                    className="flex items-center"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Company
                  </a>
                </motion.button>
              )}
              {/* Only show Add User button for admin */}
              {userRole === "admin" && (
                <motion.button
                  className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <a
                    href="/dashboard/admin/users/add"
                    className="flex items-center"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </a>
                </motion.button>
              )}
              <motion.div
                whileHover={{ rotate: 10 }}
                whileTap={{ rotate: -10 }}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-500 text-white">
                    A
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </div>
          </div>
        </header>
        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
