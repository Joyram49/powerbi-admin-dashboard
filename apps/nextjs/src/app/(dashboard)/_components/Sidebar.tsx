"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  FileText,
  Home,
  KeyRound,
  LogOut,
  ShieldPlus,
  UserPlus,
  Users,
} from "lucide-react";

import { api } from "~/trpc/react";

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
  superAdmin: [
    {
      href: "/super-admin",
      icon: <Home className="mr-3 h-5 w-5" />,
      label: "Home",
    },
    // {
    //   href: "/dashboard/super-admin/companies",
    //   icon: <Building className="mr-3 h-5 w-5" />,
    //   label: "Company List",
    // },
    {
      href: "/super-admin/companies/add",
      icon: <BriefcaseBusiness className="mr-3 h-5 w-5" />,
      label: "Add Company",
    },
    {
      href: "/super-admin/users",
      icon: <Users className="mr-3 h-5 w-5" />,
      label: "Super Admins",
    },
    {
      href: "/super-admin/users/add",
      icon: <ShieldPlus className="mr-3 h-5 w-5" />,
      label: "Add Super Admin",
    },
    {
      href: "/super-admin/users/add",
      icon: <Activity className="mr-3 h-5 w-5" />,
      label: "Track Logins",
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
      href: "/admin",
      icon: <Home className="mr-3 h-5 w-5" />,
      label: "Home",
    },
    // {
    //   href: "/dashboard/admin/reports",
    //   icon: <FileText className="mr-3 h-5 w-5" />,
    //   label: "Report List",
    // },
    {
      href: "/admin/users",
      icon: <Users className="mr-3 h-5 w-5" />,
      label: "Users List",
    },
    {
      href: "/admin/users/add",
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
      href: "/user",
      icon: <Home className="mr-3 h-5 w-5" />,
      label: "Home",
    },
    {
      href: "/user/reports",
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

export default function Sidebar() {
  const pathname = usePathname();
  const { data } = api.auth.getProfile.useQuery();
  const userRole = data?.user.user_metadata.role as string;


  // Default to USER navigation items if userRole is undefined
  // or if the userRole doesn't match any key in navigationItems
  const items =
    userRole && Object.keys(navigationItems).includes(userRole)
      ? navigationItems[userRole as keyof typeof navigationItems]
      : navigationItems.user;

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
      </nav>
    </motion.aside>
  );
}
