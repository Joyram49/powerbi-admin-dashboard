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
  UserPlus,
  Users,
} from "lucide-react";

// Animation Variants
const sidebarVariants = {
  hidden: { x: -250, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeInOut" },
  },
};

const navigationItems = {
  SUPER_ADMIN: [
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
  ADMIN: [
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
  USER: [
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

export default function Sidebar({
  userRole,
}: {
  userRole: string | undefined;
}) {
  const pathname = usePathname();

  // Default to USER navigation items if userRole is undefined
  // or if the userRole doesn't match any key in navigationItems
  const items =
    userRole && Object.keys(navigationItems).includes(userRole)
      ? navigationItems[userRole as keyof typeof navigationItems]
      : navigationItems.USER;

  return (
    <motion.aside
      className="hidden w-64 flex-col bg-slate-900 text-white dark:bg-slate-800 md:flex"
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
    >
      <div className="flex h-16 items-center border-b border-slate-800 px-4">
        <BarChart3 className="h-6 w-6 text-blue-500" />
        <span className="ml-2 text-xl font-bold">JOC Analytics</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {items.map((item, index) => (
          <a
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
          </a>
        ))}
      </nav>
    </motion.aside>
  );
}
